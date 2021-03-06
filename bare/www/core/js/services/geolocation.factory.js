angular.module('webmapp')
    .factory('GeolocationService', function GeolocationService(
        $cordovaDeviceOrientation,
        $cordovaGeolocation,
        $ionicPlatform,
        $ionicPopup,
        $q,
        $rootScope,
        $translate,
        Auth,
        Communication,
        CONFIG,
        MapService,
        Utils
    ) {
        // Contains all the exposed functions
        var geolocationService = {};

        /**
         * state goes from:
         * 0. {false, false, false, false}  > {true, true, false, false}   - geolocation enabled waiting for position
         * 1. {true, true, false, false}    > {true, false, true, false}   - got position and follow activated
         * 2. {true, false, -, -}           > {true, false, false, false}  - at drag/zoom
         * 3. {true, false, false, false}   > {true, false, true, false}   - geolocation button clicked
         * 4. {true, false, true, false}    > {true, false, true, true}    - geolocation button clicked
         * 5. {true, false, true, true}     > {true, false, false, false}  - geolocation button clicked
         * 6. {true, false, -, -}           > {false, false, false, false} - geolocation disabled
         *
         * @event geolocationState-changed when change at least one value
         */
        var geolocationState = {
            isActive: false,
            isLoading: false,
            isFollowing: false,
            isRotating: false
        };

        var gpsActive = false,
            isAndroid = window.cordova && window.cordova.platformId === "ios" ? false : true;

        const constants = {
            compassRotationTimeout: 8000, // Time in milliseconds to wait before switching from gps rotation to compass rotation
            currentSpeedTimeWindow: 10000, // Time in milliseconds window of positions to calculate currentSpeed with
            geolocationTimeoutTime: 60000,
            minSpeedForGpsBearing: 2, // Speed in km/h needed to switch from compass to gps bearing
            outOfTrackToastDelay: 10000,
            outOfTrackDistance: (CONFIG.NAVIGATION && CONFIG.NAVIGATION.trackBoundsDistance) ?
                CONFIG.NAVIGATION.trackBoundsDistance : (
                    (CONFIG.MAIN && CONFIG.MAIN.NAVIGATION && CONFIG.MAIN.NAVIGATION.trackBoundsDistance) ?
                        CONFIG.MAIN.NAVIGATION.trackBoundsDistance :
                        200
                )
        };

        //Contains all the global variables
        var state = {
            appState: 0,
            config: {},
            isOutsideBoundingBox: false,
            lastHeading: 0,
            lastPosition: null,
            lpf: null,
            orientationWatch: null,
            positionWatch: null,
            rotationSwitchTimeout: null,
            skipZoomEvent: false,
            reset: function () {
                state.appState = 0;
                state.isOutsideBoundingBox = false;
                state.lastHeadind = 0;
                state.lastPosition = null;
                state.lpf = null;
                state.orientationWatch = null;
                state.positionWatch = null;
                state.rotationSwitchTimeout = null;
                state.skipZoomEvent = false;
            }
        };

        //Contains all the variables needed when recording stats
        var recordingState = {
            currentSpeedPositions: [],
            currentTrack: null,
            firstPositionSet: false,
            isActive: false,
            isPaused: false,
            isRecordingPolyline: false,
            stats: {
                time: new Utils.Stopwatch(),
                distance: 0,
                averageSpeed: 0,
                currentSpeed: 0
            },
            toast: {
                hideTimeout: null,
                showTimeout: null,
                visible: false,
                reset: function () {
                    try {
                        clearInterval(recordingState.toast.hideTimeout);
                    } catch (e) { }

                    try {
                        clearInterval(recordingState.toast.showTimeout);
                    } catch (e) { }

                    recordingState.toast.hideTimeout = null;
                    recordingState.toast.showTimeout = null;

                    Utils.hideToast();
                    recordingState.toast.visible = false;
                }
            },
            reset: function () {
                recordingState.currentSpeedPositions = [];
                recordingState.currentTrack = null;
                recordingState.firstPositionSet = false;
                recordingState.isActive = false;
                recordingState.isPaused = false;
                recordingState.isRecordingPolyline = false;
                recordingState.stats.time.stop();
                recordingState.stats.distance = 0;
                recordingState.stats.averageSpeed = 0;
                recordingState.stats.currentSpeed = 0;
                recordingState.toast.reset();
            }
        };

        //Contains realTimeTracking configuration
        var realTimeTracking = {
            enabled: (CONFIG.NAVIGATION && CONFIG.NAVIGATION.TRACKING && CONFIG.NAVIGATION.TRACKING.enableRealTimeTracking) ||
                (CONFIG.MAIN && CONFIG.MAIN.NAVIGATION && CONFIG.MAIN.NAVIGATION.TRACKING && CONFIG.MAIN.NAVIGATION.TRACKING.enableRealTimeTracking),
            url: "https://api.webmapp.it/services/share.php",
            positionsToSend: [],
            minPositionsToSend: 1,
            minDistanceBetweenPosition: 6,
            lastPosition: null,
            app: {
                id: CONFIG.appId,
                routeId: CONFIG.routeID ? CONFIG.routeID : null,
                name: CONFIG.MAIN ? CONFIG.MAIN.OPTIONS.title : CONFIG.OPTIONS.title,
                route: CONFIG.MAIN ? CONFIG.OPTIONS.title : null
            },
            device: {
                os: ionic.Platform.device().platform,
                version: ionic.Platform.device().version
            },
            user: {},
            isActive: false,
            reset: function () {
                realTimeTracking.positionsToSend = [];
                realTimeTracking.lastPosition = null;
                realTimeTracking.isActive = false;
            }
        };

        if (CONFIG.NAVIGATION && CONFIG.NAVIGATION.TRACKING && CONFIG.NAVIGATION.realTimeTrackingUrl) {
            realTimeTracking.url = CONFIG.NAVIGATION.TRACKING.realTimeTrackingUrl;
        }
        else if (CONFIG.MAIN && CONFIG.MAIN.NAVIGATION && CONFIG.MAIN.NAVIGATION.TRACKING && CONFIG.MAIN.NAVIGATION.realTimeTrackingUrl) {
            realTimeTracking.url = CONFIG.MAIN.NAVIGATION.TRACKING.realTimeTrackingUrl;
        }

        if (CONFIG.NAVIGATION && CONFIG.NAVIGATION.TRACKING && CONFIG.NAVIGATION.TRACKING.minPositionsToSend) {
            realTimeTracking.minPositionsToSend = CONFIG.NAVIGATION.TRACKING.minPositionsToSend;
        }
        else if (CONFIG.MAIN && CONFIG.MAIN.NAVIGATION && CONFIG.MAIN.NAVIGATION.TRACKING && CONFIG.MAIN.NAVIGATION.TRACKING.minPositionsToSend) {
            realTimeTracking.minPositionsToSend = CONFIG.MAIN.NAVIGATION.TRACKING.minPositionsToSend;
        }

        if (CONFIG.NAVIGATION && CONFIG.NAVIGATION.TRACKING && CONFIG.NAVIGATION.TRACKING.minDistanceBetweenPosition) {
            realTimeTracking.minDistanceBetweenPosition = CONFIG.NAVIGATION.TRACKING.minDistanceBetweenPosition;
        }
        else if (CONFIG.MAIN && CONFIG.MAIN.NAVIGATION && CONFIG.MAIN.NAVIGATION.TRACKING && CONFIG.MAIN.NAVIGATION.TRACKING.minDistanceBetweenPosition) {
            realTimeTracking.minDistanceBetweenPosition = CONFIG.MAIN.NAVIGATION.TRACKING.minDistanceBetweenPosition;
        }

        var trackRecordingEnabled = !Utils.isBrowser() && CONFIG.NAVIGATION && CONFIG.NAVIGATION.enableTrackRecording;

        /**
         * @description
         * Center the map in [lat, long] position skipping the zoom event handling
         *
         * @param {number} lat
         * @param {number} long
         */
        function centerOnCoordsWithoutZoomEvent(lat, long) {
            if (MapService.hasMap()) {
                var currentZoom = MapService.getZoom();
                if (currentZoom < CONFIG.MAP.maxZoom) {
                    state.skipZoomEvent = true;
                }

                MapService.centerOnCoords(lat, long);
            }
        };

        /**
         * @description
         * Check if location is authorized and then if GPS is active and
         * eventually ask to activate it
         *
         * @returns {promise}
         */
        function checkGPS() {
            var defer = $q.defer();

            var onSuccess = function (e) {
                if (e) {
                    gpsActive = true;
                    defer.resolve(true);
                } else {
                    $ionicPopup.confirm({
                        title: $translate.instant("ATTENZIONE"),
                        template: $translate.instant("Sembra che tu abbia il GPS disattivato. Per accedere a tutte le funzionalità dell'app occorre attivarlo. Vuoi farlo ora?")
                    }).then(function (res) {
                        if (res) {
                            if (window.cordova.platformId === "ios") {
                                cordova.plugins.diagnostic.switchToSettings();
                            } else {
                                cordova.plugins.diagnostic.switchToLocationSettings();
                            }
                        }
                    });
                    defer.reject(ERRORS.GPS_DISABLED);
                }
            };

            /* istanbul ignore next */
            var onError = function (e) {
                console.error(e);
                defer.reject(ERRORS.GENERIC_GPS);
            };

            cordova.plugins.diagnostic.isLocationAuthorized(function (authorized) {
                if (authorized) {
                    if (window.cordova.platformId === "ios") {
                        cordova.plugins.diagnostic.isLocationEnabled(
                            onSuccess,
                            onError
                        );
                    } else {
                        cordova.plugins.diagnostic.isGpsLocationEnabled(
                            onSuccess,
                            onError
                        );
                    }
                } else {
                    if (window.cordova.platformId === "ios") {
                        var permissionDenied = localStorage.$wm_ios_location_permission_denied ? true : false;
                        if (permissionDenied) {
                            $ionicPopup.alert({
                                title: $translate.instant("ATTENZIONE"),
                                template: $translate.instant("Tutte le funzionalità legate alla tua posizione sono disabilitate. Puoi riattivarle autorizzando l'uso della tua positione tramite le impostazioni del tuo dispositivo")
                            });
                            defer.reject(ERRORS.GPS_PERMISSIONS_DENIED);
                        }
                    }

                    cordova.plugins.diagnostic.requestLocationAuthorization(function (status) {
                        switch (status) {
                            case cordova.plugins.diagnostic.permissionStatus.GRANTED:
                            case cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE:
                                if (window.cordova.platformId === "ios") {
                                    cordova.plugins.diagnostic.isLocationEnabled(
                                        onSuccess,
                                        onError
                                    );
                                } else {
                                    cordova.plugins.diagnostic.isGpsLocationEnabled(
                                        onSuccess,
                                        onError
                                    );
                                }
                                break;
                            case cordova.plugins.diagnostic.permissionStatus.DENIED:
                                if (window.cordova.platformId === "ios") {
                                    localStorage.$wm_ios_location_permission_denied = true;
                                    $ionicPopup.alert({
                                        title: $translate.instant("ATTENZIONE"),
                                        template: $translate.instant("Tutte le funzionalità legate alla tua posizione sono disabilitate. Puoi riattivarle autorizzando l'uso della tua positione tramite le impostazioni del tuo dispositivo")
                                    });
                                } else {
                                    $ionicPopup.alert({
                                        title: $translate.instant("ATTENZIONE"),
                                        template: $translate.instant("Alcune funzionalità funzionano solo se hai abilitato la geolocalizzazione")
                                    });
                                }
                                defer.reject(ERRORS.GPS_PERMISSIONS_DENIED);
                                break;
                            case cordova.plugins.diagnostic.permissionStatus.DENIED_ALWAYS:
                                $ionicPopup.alert({
                                    title: $translate.instant("ATTENZIONE"),
                                    template: $translate.instant("Tutte le funzionalità legate alla tua posizione sono disabilitate. Puoi attivarle autorizzando l'uso della tua positione tramite le impostazioni del tuo dispositivo")
                                });
                                defer.reject(ERRORS.GPS_PERMISSIONS_DENIED);
                                break;
                        }
                    },
                        onError,
                        cordova.plugins.diagnostic.locationAuthorizationMode.ALWAYS);
                }
            });

            return defer.promise;
        };

        /**
         * @description
         * Handle the case when the gps changes status in live
         *
         * @param {*} GPSState
         */
        function GPSSettingsSwitched(GPSState) {
            if ((window.cordova.platformId === "android" && GPSState !== cordova.plugins.diagnostic.locationMode.LOCATION_OFF) ||
                (window.cordova.platformId === "ios" && (GPSState === cordova.plugins.diagnostic.permissionStatus.GRANTED ||
                    GPSState === cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE))
            ) {
                geolocationService.enable();
            } else {
                if (recordingState.isActive) {
                    $ionicPopup.alert({
                        title: $translate.instant("ATTENZIONE"),
                        template: $translate.instant("La navigazione è stata interrotta a causa di un'interruzione del servizio di geolocalizzazione")
                    });
                    recordingState.reset();
                    $rootScope.$emit('recordingState-changed', {
                        isActive: false,
                        isPaused: false
                    });
                }
                gpsActive = false;
                geolocationService.disable();
            }
        };

        function turnOffRotation() {
            try {
                state.orientationWatch.clearWatch();
            }
            catch (e) { }
            delete state.orientationWatch;
            state.orientationWatch = null;

            if (state.rotationSwitchTimeout) {
                try {
                    clearTimeout(state.rotationSwitchTimeout);
                }
                catch (e) { }
                state.rotationSwitchTimeout = null;
            }

            MapService.togglePositionIcon("locationIcon")

            geolocationState.isRotating = false;
            MapService.mapIsRotating(geolocationState.isRotating);
            $rootScope.$emit("geolocationState-changed", geolocationState);

            state.lastHeading = 0;
            MapService.animateBearing(0, 800);
            $rootScope.$emit("heading-changed", state.lastHeading);
        };

        function turnOffRotationAndFollow() {
            turnOffRotation();

            geolocationState.isFollowing = false;
            $rootScope.$emit("geolocationState-changed", geolocationState);
        };

        function geolocationErrorCallback(error) {
            try {
                watchInterval.clearWatch();
            } catch (e) { }

            try {
                $cordovaGeolocation.clearWatch();
            } catch (e) { }

            /**
             * error.code === 1 => position denied
             * error.code === 2 => position unavailable
             * error.code === 3 => position timed out
             * default          => try to reboot BackgroundGeolocation
             */
            switch (+error.code) {
                case 1:
                    geolocationService.disable();
                    geolocationService.enable();
                    break;
                case 2:
                    $ionicPopup.alert({
                        title: $translate.instant("ATTENZIONE"),
                        template: $translate.instant("Si è verificato un errore durante la geolocalizzazione") + '<br>code: ' + error.code + '<br>message: ' + error.message
                    });

                    if (recordingState.isActive) {
                        geolocationService.stopRecording();
                    }
                    geolocationService.disable();
                    break;
                case 3:
                default:
                    BackgroundGeolocation.stop();
                    BackgroundGeolocation.start();
                    break;
            }
        };

        function rotationCallback(rotation) {
            if (!geolocationState.isRotating) {
                turnOffRotation();
            } else {
                // console.log(rotation)

                var heading = (-rotation.magneticHeading);

                if (Math.abs(heading - state.lastHeading) > 60) {
                    state.lpf = new LPF(0.5);
                    state.lpf.init(Array(6).fill(heading));
                }

                heading = state.lpf.next(heading);

                MapService.animateBearing(heading, 75);
                // MapService.setBearing(heading);
                state.lastHeading = heading;
                $rootScope.$emit("heading-changed", state.lastHeading);
            }
        };

        function enableCompassRotation() {
            try {
                state.orientationWatch.clearWatch();
            }
            catch (e) { }

            state.orientationWatch = $cordovaDeviceOrientation.watchHeading({
                frequency: 100
            });

            state.orientationWatch.then(
                null,
                function (error) {
                    if (geolocationState.isRotating) {
                        geolocationState.isRotating = false;
                        MapService.mapIsRotating(geolocationState.isRotating);
                        $rootScope.$emit("geolocationState-changed", geolocationState);
                    }
                    state.lastHeading = 0;
                    MapService.animateBearing(0, 800);
                    $rootScope.$emit("heading-changed", state.lastHeading);
                    console.warn(error);
                },
                rotationCallback
            );
        }

        function activateRotation() {
            state.lpf = new LPF(0.5);

            geolocationState.isRotating = true;
            MapService.mapIsRotating(geolocationState.isRotating);
            $rootScope.$emit("geolocationState-changed", geolocationState);

            if (state.lastPosition && state.lastPosition.heading && state.lastPosition.timestamp > Date.now() - constants.compassRotationTimeout) {
                state.lastHeading = state.lastPosition.heading;
                MapService.setBearing(state.lastPosition.heading);
                $rootScope.$emit("heading-changed", state.lastHeading);
                state.rotationSwitchTimeout = setTimeout(function () {
                    enableCompassRotation();
                }, constants.compassRotationTimeout);
            }
            else {
                enableCompassRotation();
            }
        };

        function updateNavigationValues(lat, long) {
            if (state.lastPosition && state.lastPosition.lat && state.lastPosition.long) {
                recordingState.stats.distance += Utils.distanceInMeters(lat, long, state.lastPosition.lat, state.lastPosition.long);

                if (state.appState === BackgroundGeolocation.BACKGROUND) {
                    // UPDATE NOTIFICATION VALUES
                    BackgroundGeolocation.configure({
                        notificationTitle: $translate.instant("Navigazione attiva")
                        // notificationText: (recordingState.stats.distance / 1000).toFixed(1) + 'km ' + $translate.instant("percorsi")
                    });
                }
            }
        };

        function handleToast(lat, long) {
            if (recordingState.currentTrack) {
                var distance = turf.pointToLineDistance.default([long, lat], recordingState.currentTrack) * 1000;
                var currentDistance = distance > 500 ? (distance / 1000).toFixed(1) : (distance - (distance % 10)).toFixed();
                var template = '',
                    message = $translate.instant('Attento, ti sei allontanato dal percorso di') + ' ' + currentDistance + ' ';

                var unit = distance > 500 ? 'km' : 'm';

                template = '<div class="toast-container">' +
                    '<div class="toast-alert-icon">' +
                    '<i class="icon wm-icon-alert"></i>' +
                    '</div>' +
                    '<div class="toast-content">' +
                    '<div class="toast-message">' +
                    message + unit +
                    '</div>' +
                    '</div>' +
                    '</div>';

                if ((distance) <= constants.outOfTrackDistance) {
                    if (recordingState.toast.visible) {
                        Utils.showToast(template);
                        if (!recordingState.toast.hideTimeout) {
                            recordingState.toast.hideTimeout = setTimeout(function () {
                                Utils.hideToast();
                                recordingState.toast.visible = false;
                                clearTimeout(recordingState.toast.hideTimeout);
                                recordingState.toast.hideTimeout = null;
                            }, constants.outOfTrackToastDelay);
                        }
                    } else if (recordingState.toast.showTimeout) {
                        clearTimeout(recordingState.toast.showTimeout);
                        recordingState.toast.showTimeout = null;
                    }
                } else {
                    if (recordingState.toast.hideTimeout) {
                        clearTimeout(recordingState.toast.hideTimeout);
                        recordingState.toast.hideTimeout = null;
                    }

                    if (recordingState.toast.visible) {
                        Utils.showToast(template);
                    } else if (!recordingState.toast.showTimeout) {
                        recordingState.toast.showTimeout = setTimeout(function () {
                            Utils.makeNotificationSound();
                            Utils.showToast(template);
                            recordingState.toast.visible = true;
                            clearTimeout(recordingState.toast.showTimeout);
                            recordingState.toast.showTimeout = null;
                        }, constants.outOfTrackToastDelay);
                    }
                }
            }
        };

        function positionTask(position) {
            BackgroundGeolocation.startTask(function (taskKey) {
                positionCallback(position);
                BackgroundGeolocation.endTask(taskKey);
            });
        };

        function realTimeTrackingFunction(lat, long, altitude) {
            var currentDistance = realTimeTracking.lastPosition ? Utils.distanceInMeters(realTimeTracking.lastPosition.lat, realTimeTracking.lastPosition.long, lat, long) : -1;

            if (currentDistance === -1 || currentDistance > realTimeTracking.minDistanceBetweenPosition) {
                realTimeTracking.lastPosition = {
                    lat: lat,
                    long: long,
                    altitude: altitude
                };

                realTimeTracking.positionsToSend.push({
                    timestamp: Date.now(),
                    coordinates: altitude ? [long, lat, altitude] : [long, lat]
                });

                if (realTimeTracking.positionsToSend.length >= realTimeTracking.minPositionsToSend) {
                    var collectionToSend = {
                        type: "FeatureCollection",
                        features: []
                    },
                        featureTemplate = {
                            type: "Feature",
                            properties: {
                                type: "realTimeTracking",
                                app: realTimeTracking.app,
                                device: realTimeTracking.device,
                                user: realTimeTracking.user
                            },
                            geometry: {
                                type: "Point"
                            }
                        };

                    for (var i in realTimeTracking.positionsToSend) {
                        featureTemplate.geometry.coordinates = realTimeTracking.positionsToSend[i].coordinates;
                        featureTemplate.properties.timestamp = realTimeTracking.positionsToSend[i].timestamp;
                        collectionToSend.features.push(featureTemplate);
                    }

                    Communication.queuedPost(realTimeTracking.url, collectionToSend, false);

                    realTimeTracking.positionsToSend.splice(0, realTimeTracking.positionsToSend.length);
                }
            }
        }

        function positionCallback(position) {
            // console.log(position);

            if (!geolocationState.isActive) {
                return;
            }

            var lat = position.latitude ? position.latitude : 0,
                long = position.longitude ? position.longitude : 0,
                accuracy = position.accuracy ? position.accuracy : 0,
                altitude = position.altitude ? position.altitude : 0,
                bearing = position.bearing ? position.bearing : false,
                speed = position.speed ? position.speed * 3.6 : 0,
                doCenter = false;

            if (geolocationState.isLoading) {
                geolocationState.isLoading = false;
                geolocationState.isFollowing = true;
                $rootScope.$emit("geolocationState-changed", geolocationState);
            }

            if (MapService.hasMap()) {
                if (!MapService.isInBoundingBox(lat, long)) {
                    state.lastPosition = null;
                    state.isOutsideBoundingBox = true;
                    $ionicPopup.alert({
                        title: $translate.instant("ATTENZIONE"),
                        template: $translate.instant("Sembra che tu sia fuori dai limiti della mappa")
                    });
                    if (recordingState.isActive) {
                        geolocationService.stopRecording();
                    }
                    geolocationService.disable();
                    return;
                }

                if (geolocationState.isRotating && bearing !== false) {
                    if (speed > constants.minSpeedForGpsBearing) {
                        if (!state.useGpsBearing) { //first valid position: keep compass
                            state.useGpsBearing = true;
                        }
                        else { //valid position confirmation: change to gps
                            MapService.togglePositionIcon("locationIconArrow");
                            if (state.orientationWatch) {
                                try {
                                    state.orientationWatch.clearWatch();
                                }
                                catch (e) { }
                                delete state.orientationWatch;
                                state.orientationWatch = null;
                            }
                            MapService.animateBearing(-bearing, 600);
                            state.lastHeading = -bearing;
                            $rootScope.$emit("heading-changed", state.lastHeading);

                            if (state.rotationSwitchTimeout) {
                                clearTimeout(state.rotationSwitchTimeout);
                            }
                            state.rotationSwitchTimeout = setTimeout(function () {
                                enableCompassRotation();
                                MapService.togglePositionIcon("locationIcon");

                                state.useGpsBearing = false;

                                delete state.rotationSwitchTimeout;
                                state.rotationSwitchTimeout = null;
                            }, constants.compassRotationTimeout);
                        }
                    }
                    else {
                        if (state.rotationSwitchTimeout) {
                            MapService.animateBearing(-bearing, 600);
                            state.lastHeading = -bearing;
                            $rootScope.$emit("heading-changed", state.lastHeading);
                        }
                    }
                }
            }

            if (!state.lastPosition || Utils.distanceInMeters(lat, long, state.lastPosition.lat, state.lastPosition.long) > 6) {
                doCenter = true;
            }

            if (doCenter) {
                if (MapService.hasMap()) {
                    MapService.drawPosition(position);
                    if (geolocationState.isFollowing) {
                        centerOnCoordsWithoutZoomEvent(lat, long);
                    }

                    if (realTimeTracking.isActive) {
                        realTimeTrackingFunction(lat, long, altitude);
                    }

                    if (recordingState.isActive && !recordingState.isPaused) {
                        if (trackRecordingEnabled && recordingState.isRecordingPolyline) {
                            MapService.updateUserPolyline([lat, long, altitude]);
                        }

                        recordingState.currentSpeedPositions.push({
                            lat: lat,
                            long: long,
                            altitude: altitude,
                            timestamp: position.time ? position.time : Date.now()
                        });

                        if (recordingState.firstPositionSet) {
                            updateNavigationValues(lat, long);
                        } else {
                            recordingState.firstPositionSet = true;
                        }

                        if (recordingState.currentTrack) {
                            handleToast(lat, long);
                        }

                        try {
                            MapService.triggerNearestPopup({
                                lat: lat,
                                long: long
                            });
                        } catch (e) { }

                    }
                }

                state.lastPosition = {
                    lat: lat,
                    long: long,
                    accuracy: accuracy,
                    altitude: altitude,
                    heading: bearing,
                    timestamp: position.time ? position.time : Date.now()
                };

                if (recordingState.isActive && state.appState === BackgroundGeolocation.BACKGROUND) {
                    saveRecordingState();
                }
            } else {
                state.lastPosition.accuracy = accuracy;
                MapService.drawAccuracy(accuracy);
            }
        };

        function activateBackgroundGeolocationHandlers() {
            BackgroundGeolocation.on('location', positionTask);
            BackgroundGeolocation.on('stationary', positionTask);
            BackgroundGeolocation.on('error', geolocationErrorCallback);
            BackgroundGeolocation.on('background', function () {
                if (recordingState.isActive) {
                    BackgroundGeolocation.configure({
                        notificationTitle: $translate.instant("Navigazione attiva"),
                        startForeground: true
                    });

                    state.appState = BackgroundGeolocation.BACKGROUND;

                    saveRecordingState();
                    if (!isAndroid) {
                        BackgroundGeolocation.switchMode(BackgroundGeolocation.FOREGROUND_MODE);
                    }
                } else {
                    BackgroundGeolocation.stop();
                }
            });
            BackgroundGeolocation.on('foreground', function () {
                if (recordingState.isActive) {
                    BackgroundGeolocation.configure({
                        startForeground: false
                    });
                    state.appState = BackgroundGeolocation.FOREGROUND;

                    deleteRecordingState();
                } else {
                    BackgroundGeolocation.start();
                }
            });
        };

        /**
         * @description
         * Check the backgroundGeolocation service status
         *
         * @returns {promise}
         *      resolve true if service is running, false otherwise
         */
        function checkStatus() {
            var defer = $q.defer();
            BackgroundGeolocation.checkStatus(function (status) {

                if (status.isRunning) {
                    defer.resolve(true);
                } else {
                    defer.resolve(false);
                }
            });
            return defer.promise;
        };

        /**
         * @description
         * Save the recording state to let application load it if restarted
         * after been active in background
         *
         */
        /* istanbul ignore next */
        function saveRecordingState() {
            var polyline = MapService.getUserPolyline();
            polyline = polyline ? polyline.getLatLngs() : null;

            var toSave = {
                currentTrack: recordingState.currentTrack ? recordingState.currentTrack : null,
                isActive: recordingState.isActive,
                isPaused: recordingState.isPaused,
                isRecordingPolyline: recordingState.isRecordingPolyline,
                stats: {
                    time: recordingState.stats.time.toString(),
                    distance: recordingState.stats.distance,
                    averageSpeed: recordingState.stats.averageSpeed,
                    currentSpeed: 0
                },
                lastPosition: state.lastPosition,
                userPolyline: polyline
            };

            localStorage.$wm_lastRecordingState = JSON.stringify(toSave);
        };

        /**
         * @description
         * Delete the saved recording state after application load it
         *
         */
        /* istanbul ignore next */
        function deleteRecordingState() {
            delete localStorage.$wm_lastRecordingState;
        };

        /**
         * @description
         * Restore the recording state
         *
         */
        /* istanbul ignore next */
        function restoreRecordingState() {
            var lastState = localStorage.$wm_lastRecordingState ? JSON.parse(localStorage.$wm_lastRecordingState) : false;

            if (lastState) {
                geolocationState.isActive = true;
                geolocationState.isLoading = false;
                geolocationState.isFollowing = false;
                geolocationState.isRotating = false;

                $rootScope.$emit("geolocationState-changed", geolocationState);

                recordingState.currentTrack = lastState.currentTrack;
                recordingState.isActive = lastState.isActive;
                recordingState.isPaused = lastState.isPaused;
                recordingState.isRecordingPolyline = lastState.isRecordingPolyline;
                recordingState.stats = {
                    time: new Utils.Stopwatch(lastState.stats.time),
                    distance: lastState.stats.distance,
                    averageSpeed: lastState.stats.averageSpeed,
                    currentSpeed: lastState.stats.currentSpeed
                };
                recordingState.firstPositionSet = true;
                state.lastPosition = lastState.lastPosition;
                if (recordingState.isRecordingPolyline) {
                    if (lastState.userPolyline) {
                        MapService.createUserPolyline(lastState.userPolyline);
                    } else {
                        MapService.createUserPolyline([]);
                    }
                }
                return true;
            } else {
                return false;
            }
        };

        /**
         * @description
         * Enable the geolocation (if disabled), checking GPS and if defined goes to
         * the specified state (refer to line 8). If the geolocaqtion service is already
         * running it start again the navigation
         *
         * @returns {promise}
         */
        geolocationService.enable = function () {
            var defer = $q.defer();
            state.isOutsideBoundingBox = false;

            if (window.cordova) {
                checkStatus().then(function (isRunningInBackground) {
                    /* istanbul ignore if */
                    if (isRunningInBackground) {
                        var restored = restoreRecordingState();

                        if (recordingState.currentTrack) {
                            setTimeout(function () {
                                MapService.showPathAndRelated({
                                    id: recordingState.currentTrack.properties.id,
                                    parentId: recordingState.currentTrack.parent.label
                                });
                            }, 1000);
                        }

                        if (restored) {
                            BackgroundGeolocation.getLocations(function (locations) {
                                var id = -1;

                                for (var i in locations) {
                                    if (locations[i].time === state.lastPosition.timestamp) {
                                        id = (+i) + 1;
                                        if (id >= locations.length) {
                                            id = 0;
                                        }
                                        break;
                                    }
                                }

                                var lastLocation = {
                                    latitude: state.lastPosition.lat,
                                    longitude: state.lastPosition.long,
                                    accuracy: state.lastPosition.accuracy ? state.lastPosition.accuracy : 10
                                };

                                // Some position have been retrieved while app shut down
                                if (id !== -1) {
                                    console.log("mmm")
                                    while (locations[id].time > state.lastPosition.timestamp) {
                                        updateNavigationValues(locations[id].latitude, locations[id].longitude);

                                        if (recordingState.isRecordingPolyline) {
                                            MapService.updateUserPolyline([locations[id].latitude, locations[id].longitude, locations[id].altitude]);
                                        }

                                        state.lastPosition = {
                                            lat: locations[id].latitude,
                                            long: locations[id].longitude,
                                            altitude: locations[id].altitude,
                                            timestamp: locations[id].time
                                        };

                                        lastLocation = locations[id];

                                        id++;
                                        if (id === locations.length) {
                                            id = 0;
                                        }
                                    }
                                }

                                deleteRecordingState();

                                MapService.drawPosition(lastLocation);

                                activateBackgroundGeolocationHandlers();
                                BackgroundGeolocation.configure(state.BackgroundGeolocationConfig);
                                state.appState = BackgroundGeolocation.FOREGROUND;

                                checkGPS().then(function () {
                                    geolocationService.switchState({
                                        isFollowing: true,
                                        isRotating: true
                                    }).then(function (qwe) {
                                        console.log("Stato", qwe);
                                        $rootScope.$emit('recordingState-changed', {
                                            isActive: recordingState.isActive,
                                            isPaused: recordingState.isPaused,
                                            currentTrack: recordingState.currentTrack ? {
                                                id: recordingState.currentTrack.properties.id,
                                                parentId: recordingState.currentTrack.parent.label
                                            } : null,
                                            recordingTrack: recordingState.isRecordingPolyline
                                        });
                                        console.log(geolocationState)
                                        defer.resolve(geolocationState);
                                    });
                                });
                            });
                        } else {
                            BackgroundGeolocation.stop();
                            defer.resolve(geolocationService.enable());
                        }
                    } else {
                        if (geolocationState.isActive) {
                            defer.resolve(geolocationState);
                        } else if (gpsActive) {
                            geolocationState.isActive = true;
                            geolocationState.isLoading = true;
                            $rootScope.$emit("geolocationState-changed", geolocationState);

                            activateBackgroundGeolocationHandlers();

                            BackgroundGeolocation.configure(state.BackgroundGeolocationConfig);

                            BackgroundGeolocation.start();

                            $cordovaGeolocation
                                .getCurrentPosition({
                                    timeout: constants.geolocationTimeoutTime,
                                    enableHighAccuracy: false
                                })
                                .then(function (position) {
                                    positionTask(position.coords);
                                }, function (err) {
                                    console.warn("CordovaGeolocation.getCurrentPosition has been rejected: ", err);
                                });

                            defer.resolve(geolocationState);
                        } else {
                            defer.resolve(checkGPS().then(geolocationService.enable));
                        }
                    }
                });
            } else {
                // TODO: find a way to mock window.location.protocol in karma
                /* istanbul ignore if */
                if (Utils.isBrowser() && window.location.protocol === "https:") {
                    geolocationState.isActive = true;
                    geolocationState.isLoading = true;
                    geolocationState.isFollowing = false;
                    geolocationState.isRotating = false;
                    gpsActive = true;

                    $rootScope.$emit("geolocationState-changed", geolocationState);

                    $cordovaGeolocation
                        .getCurrentPosition({
                            timeout: constants.geolocationTimeoutTime,
                            enableHighAccuracy: true
                        }).then(function (pos) {
                            geolocationState.isFollowing = true;
                            geolocationState.isLoading = false;
                            positionCallback(pos.coords);

                            state.positionWatch = $cordovaGeolocation
                                .watchPosition({
                                    timeout: constants.geolocationTimeoutTime,
                                    enableHighAccuracy: true
                                });

                            state.positionWatch.then(null,
                                function (err) {
                                    console.warn("CordovaGeolocation.watchPosition has been rejected: ", err);
                                    $ionicPopup.alert({
                                        title: $translate.instant("ATTENZIONE"),
                                        template: $translate.instant("Si è verificato un errore durante la geolocalizzazione, riprova")
                                    });

                                    geolocationService.disable();
                                },
                                function (position) {
                                    positionCallback(position.coords);
                                });
                        }, function (err) {
                            console.warn("CordovaGeolocation.watchPosition has been rejected: ", err);
                            $ionicPopup.alert({
                                title: $translate.instant("ATTENZIONE"),
                                template: $translate.instant("Si è verificato un errore durante la geolocalizzazione, riprova")
                            });

                            geolocationService.disable();
                        });

                    defer.resolve(geolocationState);
                }
                else {
                    defer.reject(ERRORS.CORDOVA_UNAVAILABLE);
                }
            }

            return defer.promise;
        };

        /**
         * @description
         * Disable the geolocation
         *
         * @returns {boolean}
         *      true if all correct, false otherwise
         */
        geolocationService.disable = function () {
            // TODO: find a way to mock window.location.protocol in karma
            /* istanbul ignore else */
            if (window.cordova) {
                BackgroundGeolocation.events.forEach(function (event) {
                    return BackgroundGeolocation.removeAllListeners(event);
                });

                if (MapService.hasMap()) {
                    turnOffRotationAndFollow();
                    MapService.removePosition();
                }
                BackgroundGeolocation.stop();
                state.reset();
                recordingState.reset();
                geolocationState.isActive = false;
                geolocationState.isLoading = false;
                $rootScope.$emit("geolocationState-changed", geolocationState);
            }
            else if (Utils.isBrowser() && window.location.protocol === "https:") {
                turnOffRotationAndFollow();
                MapService.removePosition();

                try {
                    state.positionWatch.clearWatch();
                }
                catch (e) { }

                state.reset();
                recordingState.reset();
                geolocationState.isActive = false;
                geolocationState.isLoading = false;
                $rootScope.$emit("geolocationState-changed", geolocationState);
            }

            return true;
        };

        /**
         * @returns {boolean}
         *      true if geolocation enabled, false otherwise
         */
        geolocationService.isActive = function () {
            return geolocationState.isActive;
        };

        /**
         * @returns {object}
         *      position if current position set, ERROR otherwise
         */
        geolocationService.getCurrentPosition = function () {
            if (state.lastPosition && state.lastPosition.lat && state.lastPosition.long) {
                return angular.copy(state.lastPosition);
            } else if (state.isOutsideBoundingBox) {
                return ERRORS.OUTSIDE_BOUNDING_BOX;
            } else {
                return ERRORS.GENERIC;
            }
        };

        /**
         * @description
         * Switch between geolocation state
         *
         * @argument {pbject} goalState [optional]
         *      contains the goal state,
         *      isFollowing and isRotating
         *
         * @returns {promise}
         *      geolocationState if all correct, error message otherwise
         *
         * @example geolocationService.enable()
         *      goes to geolocationState 1.1
         *
         * @example geolocationService.enable({isFollowing: true, isRotating: true})
         *      goes to geolocationState 4.1
         */
        geolocationService.switchState = function (goalState) {
            var defer = $q.defer();

            if (!gpsActive) {
                defer.reject(ERRORS.GPS_DISABLED);
            } else if (!geolocationState.isActive) {
                defer.reject(ERRORS.GEOLOCATION_DISABLED);
            } else if (geolocationState.isLoading) {
                defer.resolve(geolocationState);
            } else if (goalState) {
                if (goalState.isFollowing !== geolocationState.isFollowing ||
                    goalState.isRotating !== geolocationState.isRotating) {
                    if (goalState.isRotating) {
                        if (!geolocationState.isFollowing) {
                            geolocationState.isFollowing = true;
                            if (state.lastPosition && state.lastPosition.lat && state.lastPosition.long) {
                                centerOnCoordsWithoutZoomEvent(state.lastPosition.lat, state.lastPosition.long);
                            }
                            $rootScope.$emit("geolocationState-changed", geolocationState);
                        }
                        if (!geolocationState.isRotating) {
                            activateRotation();
                        }
                    }
                    // isRotating || !isFollowing
                    else if (goalState.isFollowing) {
                        if (geolocationState.isRotating) {
                            turnOffRotation();
                        }

                        if (!geolocationState.isFollowing) {
                            geolocationState.isFollowing = true;
                            if (state.lastPosition && state.lastPosition.lat && state.lastPosition.long) {
                                centerOnCoordsWithoutZoomEvent(state.lastPosition.lat, state.lastPosition.long);
                            }
                            $rootScope.$emit("geolocationState-changed", geolocationState);
                        }
                    } else {
                        turnOffRotationAndFollow();
                    }
                }
                defer.resolve(geolocationState);
            } else if (geolocationState.isFollowing && !geolocationState.isRotating) {
                activateRotation();
                defer.resolve(geolocationState);
            } else {
                if (geolocationState.isRotating) {
                    turnOffRotation();
                }

                if (!geolocationState.isFollowing) {
                    geolocationState.isFollowing = true;

                    $rootScope.$emit("geolocationState-changed", geolocationState);

                    if (state.lastPosition && state.lastPosition.lat && state.lastPosition.long) {
                        centerOnCoordsWithoutZoomEvent(state.lastPosition.lat, state.lastPosition.long);
                    }
                }
                defer.resolve(geolocationState);
            }

            return defer.promise;
        };

        /**
         * @description
         * Start recording stats
         *
         * @param {boolean} [optional] recordTrack
         *      if true record the track in a geojson feature
         *
         * @param {Object(parentId, id)} [optional] navigationTrack
         *      if set select the navigation track
         *
         * @returns {promise}
         *      resolve the recording state when correct, reject otherwise
         */
        geolocationService.startRecording = function (navigationTrack, recordTrack) {
            var defer = $q.defer();
            if (!navigationTrack && !recordTrack) {
                defer.reject(ERRORS.MISSING_ARGUMENTS)
            }
            if (!recordingState.isActive) {
                recordingState.reset();
                recordingState.isActive = true;
                recordingState.stats.time.start();
                state.skipZoomEvent = true;
                $rootScope.$emit('recordingState-changed', {
                    isActive: recordingState.isActive,
                    isPaused: recordingState.isPaused
                });

                if (state.lastPosition && state.lastPosition.lat && state.lastPosition.long) {
                    try {
                        MapService.triggerNearestPopup({
                            lat: state.lastPosition.lat,
                            long: state.lastPosition.long
                        })
                    } catch (e) { };
                    recordingState.firstPositionSet = true;
                } else {
                    recordingState.firstPositionSet = false;
                }

                if (navigationTrack && navigationTrack.parentId && navigationTrack.id) {
                    MapService.getFeatureById(navigationTrack.id, navigationTrack.parentId)
                        .then(function (track) {
                            if (track.geometry.type === 'LineString' || track.geometry.type === 'MultiLineString') {
                                recordingState.currentTrack = track;
                                if (state.lastPosition && state.lastPosition.lat && state.lastPosition.long) {
                                    handleToast(state.lastPosition.lat, state.lastPosition.long);
                                }
                            }
                        })
                        .catch(function (err) { });
                } else {
                    recordingState.currentTrack = null;
                }

                if (recordTrack) {
                    recordingState.isRecordingPolyline = true;
                    if (recordingState.firstPositionSet) {
                        MapService.createUserPolyline([
                            [state.lastPosition.lat, state.lastPosition.long, 0]
                        ]);
                    } else {
                        MapService.createUserPolyline([]);
                    }
                }

                if (realTimeTracking.enabled) {
                    geolocationService.startRemoteTracking();
                }

                defer.resolve({
                    isActive: recordingState.isActive,
                    isPaused: recordingState.isPaused
                });
            } else {
                defer.reject(ERRORS.ALREADY_ACTIVE);
            }

            return defer.promise;
        };

        /**
         * @description
         * Pause the stats record saving the state
         *
         * @returns {promise}
         *      resolve if all correct, false otherwise
         */
        geolocationService.pauseRecording = function () {
            var defer = $q.defer();
            if (recordingState.isActive && !recordingState.isPaused) {
                recordingState.isPaused = true;
                recordingState.firstPositionSet = false;
                recordingState.stats.time.pause();
                $rootScope.$emit('recordingState-changed', {
                    isActive: recordingState.isActive,
                    isPaused: recordingState.isPaused
                });

                recordingState.toast.reset();

                if (realTimeTracking.isActive) {
                    geolocationService.stopRemoteTracking();
                }

                defer.resolve({
                    isActive: recordingState.isActive,
                    isPaused: recordingState.isPaused
                });
            } else if (recordingState.isActive && recordingState.isPaused) {
                defer.resolve({
                    isActive: recordingState.isActive,
                    isPaused: recordingState.isPaused
                });
            } else {
                defer.reject(ERRORS.DISABLED);
            }

            return defer.promise;
        };

        /**
         * @description
         * Resume to record stats from the last saved moment
         *
         * @returns {boolean}
         *      true if all correct, false otherwise
         */
        geolocationService.resumeRecording = function () {
            var defer = $q.defer();
            if (recordingState.isActive && recordingState.isPaused) {
                recordingState.isPaused = false;
                recordingState.stats.time.resume();
                $rootScope.$emit('recordingState-changed', {
                    isActive: recordingState.isActive,
                    isPaused: recordingState.isPaused
                });

                if (state.lastPosition && state.lastPosition.lat && state.lastPosition.long) {
                    handleToast(state.lastPosition.lat, state.lastPosition.long);
                }

                if (realTimeTracking.enabled) {
                    geolocationService.startRemoteTracking();
                }

                defer.resolve({
                    isActive: recordingState.isActive,
                    isPaused: recordingState.isPaused
                });
            } else if (recordingState.isActive && !recordingState.isPaused) {
                geolocationService.startRemoteTracking();

                defer.resolve({
                    isActive: recordingState.isActive,
                    isPaused: recordingState.isPaused
                });
            } else {
                defer.reject(ERRORS.DISABLED);
            }

            return defer.promise;
        };

        /**
         * @description
         * Stop to record stats from the last saved moment
         *
         * @returns {promise}
         */
        geolocationService.stopRecording = function () {
            var defer = $q.defer();
            recordingState.reset();
            $rootScope.$emit('recordingState-changed', {
                isActive: recordingState.isActive,
                isPaused: recordingState.isPaused
            });

            if (realTimeTracking.isActive) {
                geolocationService.stopRemoteTracking();
            }

            defer.resolve({
                isActive: recordingState.isActive,
                isPaused: recordingState.isPaused
            });

            return defer.promise;
        };

        /**
         * @description
         * Stop to record stats from the last saved moment
         *
         * @throws {NoStatsException}
         *      if record never started
         *
         * @returns {boolean}
         *      all the recorded stats
         */
        geolocationService.getStats = function () {
            var defer = $q.defer();
            if (recordingState.isActive) {
                recordingState.stats.averageSpeed = (recordingState.stats.distance / recordingState.stats.time.getTime()) * 3600;

                while (recordingState.currentSpeedPositions &&
                    recordingState.currentSpeedPositions[0] &&
                    recordingState.currentSpeedPositions[0].timestamp < Date.now() - constants.currentSpeedTimeWindow) {
                    delete recordingState.currentSpeedPositions[0];
                    recordingState.currentSpeedPositions.shift(-1);
                }

                if (recordingState.currentSpeedPositions && recordingState.currentSpeedPositions.length > 1) {
                    var time = Date.now() - recordingState.currentSpeedPositions[0].timestamp,
                        distance = 0;

                    for (var i = 1; i < recordingState.currentSpeedPositions.length; i++) {
                        distance += Utils.distanceInMeters(
                            recordingState.currentSpeedPositions[i - 1].lat, recordingState.currentSpeedPositions[i - 1].long,
                            recordingState.currentSpeedPositions[i].lat, recordingState.currentSpeedPositions[i].long
                        );
                    }

                    recordingState.stats.currentSpeed = (distance / time) * 3600;
                }
                else {
                    recordingState.stats.currentSpeed = 0;
                }

                var currentStats = {
                    time: recordingState.stats.time.getTime(),
                    distance: recordingState.stats.distance,
                    averageSpeed: recordingState.stats.averageSpeed,
                    currentSpeed: recordingState.stats.currentSpeed
                };

                defer.resolve(currentStats);
            } else {
                defer.reject(false);
            }

            return defer.promise;
        };

        /**
         * @description
         * Start the remote tracking with our server
         *
         * @returns {boolean}
         *      true if started correctly, false otherwise
         */
        geolocationService.startRemoteTracking = function () {
            realTimeTracking.reset();
            realTimeTracking.isActive = true;
            return true;
        };

        /**
         * @description
         * Stop the remote tracking with our server
         *
         * @returns {boolean}
         *      true if correctly executed, false otherwise
         */
        geolocationService.stopRemoteTracking = function () {
            realTimeTracking.isActive = false;
            realTimeTracking.reset();
            return true;
        };

        $rootScope.$on('map-dragstart', function (e, value) {
            turnOffRotationAndFollow();
        });

        $rootScope.$on('map-zoomstart', function (e, value) {
            if (!state.skipZoomEvent) {
                turnOffRotationAndFollow();
            } else {
                state.skipZoomEvent = false;
            }
        });

        $rootScope.$on('logged-in', function () {
            if (Auth.isLoggedIn()) {
                var userData = Auth.getUserData();
                if (userData && userData.ID) {
                    realTimeTracking.user = {
                        id: userData.ID,
                        email: userData.user_email,
                        first_name: userData.first_name,
                        last_name: userData.last_name
                    };
                }
                else {
                    realTimeTracking.user = {};
                }
            }
        });

        $ionicPlatform.ready(function () {
            if (window.cordova) {
                cordova.plugins.diagnostic.registerLocationStateChangeHandler(GPSSettingsSwitched);
                state.appState = BackgroundGeolocation.FOREGROUND;
                state.BackgroundGeolocationConfig = {
                    locationProvider: BackgroundGeolocation.RAW_PROVIDER,
                    desiredAccuracy: BackgroundGeolocation.HIGH_ACCURACY,
                    stationaryRadius: 25, // for DISTANCE_FILTER_PROVIDER
                    distanceFilter: 5, // for DISTANCE_FILTER_PROVIDER and RAW_PROVIDER
                    stopOnTerminate: true,
                    startOnBoot: false, // Android only
                    interval: 500, // Android only
                    // fastestInterval: 100, // Android only, for ACTIVITY location provider
                    // activitiesInterval: 10000, // Android only, for ACTIVITY location provider
                    // stopOnStillActivity: false, // Android only, for ACTIVITY location provider
                    startForeground: false, // Android only
                    notificationTitle: $translate.instant("Navigazione attiva"), // Android only
                    notificationText: "", // Android only
                    notificationIconColor: "#FF00FF", // Android only
                    activityType: "OtherNavigation", // iOS only
                    pauseLocationUpdates: false, // iOS only
                    saveBatteryOnBackground: false, // iOS only
                    maxLocations: 10000
                };

                var userData = Auth.getUserData();
                if (userData && userData.ID) {
                    realTimeTracking.user = {
                        id: userData.ID,
                        email: userData.user_email,
                        first_name: userData.first_name,
                        last_name: userData.last_name
                    };
                }
                else {
                    realTimeTracking.user = {};
                }
            }
        });

        return geolocationService;
    });
