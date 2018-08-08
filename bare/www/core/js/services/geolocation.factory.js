angular.module('webmapp')

    .factory('GeolocationService', function GeolocationService(
        $cordovaDeviceOrientation,
        $cordovaGeolocation,
        $ionicPopup,
        $q,
        $rootScope,
        $translate,
        CONFIG,
        MapService,
        Utils
    ) {
        // Contains all the exposed functions
        var geolocationService = {};

        console.warn("TODO: handle all translations");
        console.warn("TODO: create public global error codes");

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

        var gpsActive = false;

        var constants = {
            geolocationTimeoutTime: 60000
        };

        //Contains all the global variables
        var state = {
            lastHeading: null,
            lastPosition: null,
            lpf: null,
            orientationWatch: null,
            isOutsideBoundingBox: false,
            skipGPSSwitchDeregistration: false,
            skipZoomEvent: false,
            watchInterval: null,
            reset: function () {
                state.lastHeadind = null;
                state.lastPosition = null;
                state.lpf = null;
                state.orientationWatch = null;
                state.isOutsideBoundingBox = false;
                state.skipGPSSwitchDeregistration = false;
                state.skipZoomEvent = false;
                state.watchInterval = null;
            }
        };

        var recordingState = {
            currentSpeedExpireTimeout: null,
            firstPositionSet: false,
            isActive: false,
            isPaused: false,
            stats: {
                time: new Utils.Stopwatch(),
                distance: 0,
                averageSpeed: 0,
                currentSpeed: 0
            },
            reset: function () {
                recordingState.currentSpeedExpireTimeout = null;
                recordingState.firstPositionSet = false;
                recordingState.isActive = false;
                recordingState.isPaused = false;
                recordingState.stats.time.stop();
                recordingState.stats.distance = 0;
                recordingState.stats.averageSpeed = 0;
                recordingState.stats.currentSpeed = 0;
            }
        };

        /**
         * @description
         * Center the map in [lat, long] position skipping the zoom event handling
         * 
         * @param {number} lat 
         * @param {number} long 
         */
        function centerOnCoorsWithoutZoomEvent(lat, long) {
            var currentZoom = MapService.getZoom();
            if (currentZoom === CONFIG.MAP.maxZoom) {
                MapService.centerOnCoords(lat, long);
            } else {
                state.skipZoomEvent = true;
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
                    })
                        .then(function (res) {
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
            if ((device.platform === "Android" && GPSState !== cordova.plugins.diagnostic.locationMode.LOCATION_OFF) ||
                (device.platform === "iOS" && (GPSState === cordova.plugins.diagnostic.permissionStatus.GRANTED ||
                    GPSState === cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE))
            ) {
                checkGPS().then(geolocationService.enable);
            }
            else {
                gpsActive = false;
                state.skipGPSSwitchDeregistration = true;
                geolocationService.disable();
            }
        };

        function turnOffRotationAndFollow() {
            if (state.orientationWatch) {
                state.orientationWatch.clearWatch();
            }
            delete state.orientationWatch;
            state.orientationWatch = null;
            geolocationState.isRotating = false;
            MapService.mapIsRotating(geolocationState.isRotating);

            geolocationState.isFollowing = false;

            $rootScope.$emit("geolocationState-changed", geolocationState);

            // setTimeout(function () {
            //     MapService.setBearing(-359.95);
            //     MapService.setBearing(-359.97);
            //     MapService.setBearing(-359.99);
            // }, 100);
        };

        function geolocationTimedOut(error) {
            console.log("Restarting geolocation");
            try {
                watchInterval.clearWatch();
            }
            catch (e) {
                console.log(e);
            }

            try {
                $cordovaGeolocation.clearWatch();
            }
            catch (e) {
                console.log(e);
            }

            /**
             * error.code === 1 => position denied
             * error.code === 2 => position unavailable
             * error.code === 3 => position timed out
             */
            switch (error.code) {
                case 1:
                    geolocation.disable()
                        .then(geolocation.enable);
                    break;
                case 2, 3:
                    if (error.code === 2) {
                        console.warn("Geolocation unavailable");
                    }
                    else {
                        console.warn("Geolocation timed out");
                    }

                    watchInterval = $cordovaGeolocation.watchPosition({
                        timeout: constants.geolocationTimeoutTime,
                        enableHighAccuracy: true
                    }).then(
                        null,
                        geolocationTimedOut,
                        positionCallback);
                    break;
                default:
                    $ionicPopup.alert({
                        title: $translate.instant("ATTENZIONE"),
                        template: $translate.instant("Si è verificato un errore durante la geolocalizzazione")
                    });
                    break;
            }
        };

        function activateRotation() {
            if (!state.orientationWatch) {
                state.lpf = new LPF(0.5);

                geolocationState.isRotating = true;
                MapService.mapIsRotating(geolocationState.isRotating);

                $rootScope.$emit("geolocationState-changed", geolocationState);

                state.orientationWatch = $cordovaDeviceOrientation.watchHeading({
                    frequency: 20
                });

                state.orientationWatch.then(
                    null,
                    function (error) {
                        if (geolocationState.isRotating) {
                            geolocationState.isRotating = false;
                            MapService.mapIsRotating(geolocationState.isRotating);
                            $rootScope.$emit("geolocationState-changed", geolocationState);
                        }

                        console.error(error);
                    },
                    function (result) {
                        if (!geolocationState.isRotating) {
                            return;
                        }

                        if (Math.abs(result.magneticHeading - state.lastHeading) > 100) {
                            state.lpf = new LPF(0.5);
                            state.lpf.init(Array(6).fill(result.magneticHeading));
                        }

                        var heading = state.lpf.next(result.magneticHeading);
                        MapService.setBearing(-heading);
                        state.lastHeading = heading;

                        $rootScope.$emit("heading-changed", state.lastHeading);
                    });
            }
        };

        function updateNavigationValues(lat, long) {
            recordingState.stats.distance += Utils.distanceInMeters(lat, long, state.lastPosition.lat, state.lastPosition.long);
            recordingState.stats.averageSpeed = (recordingState.stats.distance / recordingState.stats.time.getTime()) * 3600;
            recordingState.stats.currentSpeed = Utils.distanceInMeters(lat, long, state.lastPosition.lat, state.lastPosition.long) / (Date.now() - state.lastPosition.timestamp) * 3600;
            recordingState.currentSpeedExpireTimeout = setTimeout(function () {
                recordingState.stats.currentSpeed = 0;
            }, 5000);
        };

        console.warn("TODO: complete function positionCallback for realTimeTracking")
        function positionCallback(position) {
            var lat = position.coords.latitude ? position.coords.latitude : 0,
                long = position.coords.longitude ? position.coords.longitude : 0,
                altitude = position.coords.altitude ? position.coords.altitude : 0,
                doCenter = false;

            if (geolocationState.isLoading) {
                geolocationState.isLoading = false;
                $rootScope.$emit("geolocationState-changed", geolocationState);
            }

            if (!MapService.isInBoundingBox(lat, long)) {
                state.lastPosition = null;
                state.isOutsideBoundingBox = true;
                geolocationService.disable();
                $ionicPopup.alert({
                    title: $translate.instant("ATTENZIONE"),
                    template: $translate.instant("Sembra che tu sia fuori dai limiti della mappa")
                });
                if (recordingState.isActive) {
                    geolocationService.pauseRecording();
                }
                return;
            }

            if (!state.lastPosition || Utils.distanceInMeters(lat, long, state.lastPosition.lat, state.lastPosition.long) > 6) {
                doCenter = true;
            }

            if (doCenter) {
                MapService.drawPosition(position);
                if (geolocationState.isFollowing) {
                    MapService.centerOnCoords(lat, long);
                }

                if (recordingState.isActive && !recordingState.isPaused) {
                    if (realTimeTracking.enabled && vm.userData.ID) {
                        // vm.positionsToSend.push({
                        //     lat: lat,
                        //     lng: long,
                        //     altitude: altitude,
                        //     heading: position.coords.heading,
                        //     speed: position.coords.speed,
                        //     timestamp: position.timestamp
                        // });

                        realTimeTracking.positionsToSend.push([
                            long,
                            lat,
                            altitude
                            // ,
                            // position.timestamp,
                            // position.coords.speed,
                            // position.coords.heading
                        ]);

                        if (realTimeTracking.positionsToSend.length >= realTimeTracking.minPositionsToSend) {
                            var currentRequest = Communication.callAPI(realTimeTracking.url, {
                                type: "FeatureCollection",
                                features: [{
                                    type: "Feature",
                                    properties: {
                                        type: "tracking",
                                        app: realTimeTracking.appUrl,
                                        routeId: vm.routeId,
                                        trackId: vm.stopNavigationUrlParams.id,
                                        email: vm.userData.user_email,
                                        firstName: vm.userData.first_name,
                                        lastName: vm.userData.last_name
                                    },
                                    geometry: {
                                        type: "LineString",
                                        coordinates: realTimeTracking.positionsToSend
                                    }
                                }]
                            });

                            currentRequest
                                .then(function () {
                                    realTimeTracking.positionsToSend = [];
                                    return;
                                },
                                    function (error) {
                                        return;
                                    });
                        }
                    }

                    if (recordingState.firstPositionSet) {
                        updateNavigationValues(lat, long);
                    } else {
                        recordingState.firstPositionSet = true;
                    }

                    MapService.triggerNearestPopup({
                        lat: lat,
                        long: long
                    });
                }

                state.lastPosition = {
                    lat: lat,
                    long: long,
                    timestamp: Date.now()
                };
            } else {
                MapService.drawAccuracy(position.coords.accuracy);
            }
        };

        /**
         * @description
         * Enable the geolocation (if disabled), checking GPS and if defined goes to
         * the specified state (refer to line 8)
         * 
         * @argument {object} state [optional]
         *      contains the goal state,
         *      isFollowing and isRotating
         * 
         * @returns {promise}
         */
        geolocationService.enable = function () {
            var defer = $q.defer();

            if (window.cordova) {
                //To prevent duplication, firstly deregistrer listener
                cordova.plugins.diagnostic.registerLocationStateChangeHandler(false);
                cordova.plugins.diagnostic.registerLocationStateChangeHandler(GPSSettingsSwitched);

                if (geolocationState.isActive) {
                    defer.resolve(geolocationState);
                }
                else if (gpsActive) {
                    geolocationState.isLoading = true;
                    $rootScope.$emit("geolocationState-changed", geolocationState);

                    $cordovaGeolocation
                        .getCurrentPosition({
                            timeout: constants.geolocationTimeoutTime,
                            enableHighAccuracy: false
                        })
                        .then(function (position) {
                            var lat = position.coords.latitude,
                                long = position.coords.longitude;

                            geolocationState.isLoading = false;
                            $rootScope.$emit("geolocationState-changed", geolocationState);

                            if (!MapService.isInBoundingBox(lat, long)) {
                                state.lastPosition = null;
                                state.isOutsideBoundingBox = true;
                                geolocationService.disable();
                                $ionicPopup.alert({
                                    title: $translate.instant("ATTENZIONE"),
                                    template: $translate.instant("Sembra che tu sia fuori dai limiti della mappa")
                                });
                                if (recordingState.isActive) {
                                    geolocationService.pauseRecording();
                                }
                                defer.reject(ERRORS.OUTSIDE_BOUNDING_BOX);
                            }
                            else {
                                state.isOutsideBoundingBox = false;
                                state.lastPosition = {
                                    lat: lat,
                                    long: long,
                                    timestamp: Date.now()
                                };

                                MapService.drawPosition(position);
                                centerOnCoorsWithoutZoomEvent(lat, long);

                                geolocationState.isActive = true;
                                geolocationState.isFollowing = true;
                                geolocationState.isRotating = false;

                                $rootScope.$emit("geolocationState-changed", geolocationState);

                                state.watchInterval = $cordovaGeolocation.watchPosition({
                                    timeout: constants.geolocationTimeoutTime,
                                    enableHighAccuracy: true
                                });
                                state.watchInterval.then(
                                    null,
                                    geolocationTimedOut,
                                    positionCallback);

                                defer.resolve(true);
                            }
                        }, function (err) {
                            geolocationState.isLoading = false;
                            $rootScope.$emit("geolocationState-changed", geolocationState);
                            $ionicPopup.alert({
                                title: $translate.instant("ATTENZIONE"),
                                template: $translate.instant("Si è verificato un errore durante la geolocalizzazione, riprova")
                            });
                            console.error(err);
                            defer.reject(ERRORS.GENERIC_GPS);
                        });
                }
                else {
                    return checkGPS().then(geolocationService.enable);
                }
            }
            else {
                defer.reject(ERRORS.CORDOVA_UNAVAILABLE);
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
            if (window.cordova) {
                if (!state.skipGPSSwitchDeregistration) {
                    cordova.plugins.diagnostic.registerLocationStateChangeHandler(false);
                }

                turnOffRotationAndFollow();
                MapService.removePosition();
                clearInterval(state.watchInterval);
                state.watchInterval = null;
                state.reset();
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
            }
            else if (geolocationState.isLoading) {
                defer.resolve(geolocationState);
            }
            else if (goalState) {
                if (goalState.isFollowing !== geolocationState.isFollowing ||
                    goalState.isRotating !== geolocationState.isRotating) {
                    if (goalState.isRotating) {
                        if (!geolocationState.isFollowing) {
                            geolocationState.isFollowing = true;
                            if (state.lastPosition && state.lastPosition.lat && state.lastPosition.long) {
                                MapService.centerOnCoords(state.lastPosition.lat, state.lastPosition.long);
                            }
                            $rootScope.$emit("geolocationState-changed", geolocationState);
                        }
                        if (!geolocationState.isRotating) {
                            activateRotation();
                        }
                    }
                    // it can mean is in rotation or not following
                    else if (goalState.isFollowing) {
                        if (geolocationState.isRotating) {
                            turnOffRotationAndFollow();
                        }

                        geolocationState.isFollowing = true;
                        if (state.lastPosition && state.lastPosition.lat && state.lastPosition.long) {
                            MapService.centerOnCoords(state.lastPosition.lat, state.lastPosition.long);
                        }
                        $rootScope.$emit("geolocationState-changed", geolocationState);
                    }
                    else {
                        turnOffRotationAndFollow();
                    }
                }
                defer.resolve(geolocationState);
            }
            else if (geolocationState.isRotating) {
                turnOffRotationAndFollow();
                defer.resolve(geolocationState);
            }
            else if (geolocationState.isFollowing) {
                geolocationState.isFollowing = true;

                $rootScope.$emit("geolocationState-changed", geolocationState);

                if (state.lastPosition && state.lastPosition.lat && state.lastPosition.long) {
                    MapService.centerOnCoords(state.lastPosition.lat, state.lastPosition.long);
                }

                activateRotation();
                defer.resolve(geolocationState);
            }
            else {
                geolocationState.isFollowing = true;

                $rootScope.$emit("geolocationState-changed", geolocationState);

                if (state.lastPosition && state.lastPosition.lat && state.lastPosition.long) {
                    MapService.centerOnCoords(state.lastPosition.lat, state.lastPosition.long);
                }
                defer.resolve(geolocationState);
            }

            return defer.promise;
        };

        /**
         * @description
         * Start recording stats
         * 
         * @param {boolean} recordTrack
         *      if true record the track in a geojson feature
         * 
         * @returns {promise}
         *      resolve when activated and switched state, reject otherwise
         */
        console.warn("TODO: function startRecording - if recordTrack record the track");
        geolocationService.startRecording = function (recordTrack) {
            recordingState.reset();
            recordingState.isActive = true;
            recordingState.stats.time.start();
            state.skipZoomEvent = true;
            $rootScope.$emit('recordingState-changed', {
                isActive: recordingState.isActive,
                isPaused: recordingState.isPaused
            });

            if (state.lastPosition && state.lastPosition.lat && state.lastPosition.long) {
                MapService.triggerNearestPopup({
                    lat: state.lastPosition.lat,
                    long: state.lastPosition.long
                });
                recordingState.firstPositionSet = true;
            }
            else {
                recordingState.firstPositionSet = false;
            }

            return true;
        };

        /**
         * @description
         * Pause the stats record saving the state
         * 
         * @returns {boolean}
         *      true if all correct, false otherwise
         */
        geolocationService.pauseRecording = function () {
            recordingState.isPaused = true;
            recordingState.firstPositionSet = false;
            recordingState.stats.time.pause();
            $rootScope.$emit('recordingState-changed', {
                isActive: recordingState.isActive,
                isPaused: recordingState.isPaused
            });
            return true;
        };

        /**
         * @description
         * Resume to record stats from the last saved moment
         * 
         * @returns {boolean}
         *      true if all correct, false otherwise
         */
        geolocationService.resumeRecording = function () {
            recordingState.isPaused = false;
            recordingState.stats.time.resume();
            $rootScope.$emit('recordingState-changed', {
                isActive: recordingState.isActive,
                isPaused: recordingState.isPaused
            });
            return true;
        };

        /**
         * @description
         * Stop to record stats from the last saved moment
         * 
         * @returns {boolean}
         *      all the recorded stats
         */
        console.warn("TODO: implement function stopRecording when track recorded");
        geolocationService.stopRecording = function () {
            recordingState.stats.time.stop();
            recordingState.reset();
            $rootScope.$emit('recordingState-changed', {
                isActive: recordingState.isActive,
                isPaused: recordingState.isPaused
            });
            return true;
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
            recordingState.stats.averageSpeed = (recordingState.stats.distance / recordingState.stats.time.getTime()) * 3600;

            var currentStats = {
                time: recordingState.stats.time.getTime(),
                distance: recordingState.stats.distance,
                averageSpeed: recordingState.stats.averageSpeed,
                currentSpeed: recordingState.stats.currentSpeed
            }
            return currentStats;
        };

        /**
         * @description
         * Start the remote tracking with our server
         * 
         * @returns {boolean}
         *      true if started correctly, false otherwise
         */
        console.warn("TODO: implement function startRemoteTracking");
        geolocationService.startRemoteTracking = function () {
            return false;
        };

        /**
         * @description
         * Stop the remote tracking with our server
         * 
         * @returns {boolean}
         *      true if correctly executed, false otherwise
         */
        console.warn("TODO: implement function stopRemoteTracking");
        geolocationService.stopRemoteTracking = function () {
            return false;
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

        return geolocationService;
    });