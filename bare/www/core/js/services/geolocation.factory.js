angular.module('webmapp')

    .factory('GeolocationService', function GeolocationService(
        $cordovaDeviceOrientation,
        $cordovaGeolocation,
        $ionicPopup,
        $q,
        $translate,
        MapService
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
         */
        var geolocationState = {
            isActive: false,
            isLoading: false,
            isFollowing: false,
            isRotating: false
        };

        var gpsActive = false;

        var stats = {
            time: 0,
            distance: 0,
            averageSpeed: 0,
            currentSpeed: 0
        };

        var constants = {
            geolocationTimeoutTime: 60000
        };

        //Contains all the global variables
        var state = {
            goalState: null,
            lastHeadind: null,
            lastPosition: null,
            lpf: null,
            orientationWatch: null,
            watchInterval: null
        };

        console.warn("TODO: handle all translations");

        function resetStats() {
            stats = {
                time: 0,
                distance: 0,
                averageSpeed: 0,
                currentSpeed: 0
            };
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

                    defer.resolve();
                    // vm.canFollow = true;
                    // vm.followActive = false;
                    // vm.isRotating = false;
                    // vm.centerOnMe();

                } else {
                    return $ionicPopup.confirm({
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
                                return;
                            } else {
                                return;
                            }
                        });
                }
            };

            var onError = function (e) {
                defer.reject(e);
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
                            return;
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
                                break;
                            case cordova.plugins.diagnostic.permissionStatus.DENIED_ALWAYS:
                                $ionicPopup.alert({
                                    title: $translate.instant("ATTENZIONE"),
                                    template: $translate.instant("Tutte le funzionalità legate alla tua posizione sono disabilitate. Puoi attivarle autorizzando l'uso della tua positione tramite le impostazioni del tuo dispositivo")
                                });
                                break;
                        }
                    },
                        onError,
                        cordova.plugins.diagnostic.locationAuthorizationMode.ALWAYS);
                }
            });

            return defer.promise;
        };

        console.warn("TODO: develop function locationCallback")
        function positionCallback(position) {
            var lat = position.coords.latitude ? position.coords.latitude : 0,
                long = position.coords.longitude ? position.coords.longitude : 0,
                altitude = position.coords.altitude ? position.coords.altitude : 0,
                doCenter = false;

            geolocationState.isLoading = false;

            if (!MapService.isInBoundingBox(lat, long)) {
                console.warn("TODO: handle bounding box")
                vm.isOutsideBoundingBox = true;
                prevLatLong = null;
                vm.turnOffRotationAndFollow();

                $ionicPopup.alert({
                    title: $translate.instant("ATTENZIONE"),
                    template: $translate.instant("Sembra che tu sia fuori dai limiti della mappa")
                });

                MapService.removePosition();
                if (watchInterval) {
                    watchInterval.clearWatch();
                }
                watchInterval = null;
                return;
            }
            else {
                vm.isOutsideBoundingBox = false;
            }

            if (!state.lastPosition || distanceInMeters(lat, long, state.lastPosition.lat, state.lastPosition.long) > 6) {
                doCenter = true;
            }

            if (doCenter) {
                MapService.drawPosition(position);
                if (geolocationState.isFollowing) {
                    MapService.centerOnCoords(lat, long);
                }

                console.warn("TODO: Handle position while navigating");
                console.err("NAVIGATION DISABLED");
                if (vm.isNavigating && !vm.isPaused && false) {
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

                    if (vm.firstPositionSet) {
                        updateNavigationValues(position, prevLatLong);
                    } else {
                        vm.firstPositionSet = true;
                        vm.lastPositionRecordTime = Date.now();
                        vm.isNotMoving = false;
                        vm.startMovingTime = Date.now();
                        vm.currentSpeedExpireTimeout = setTimeout(function () {
                            vm.currentSpeedText = '0 km/h';
                            vm.isNotMoving = true;
                            vm.movingTime = vm.movingTime + Date.now() - vm.startMovingTime;
                        }, 5000);
                    }

                    MapService.triggerNearestPopup({
                        lat: lat,
                        long: long
                    });
                }

                state.lastPosition = {
                    lat: lat,
                    long: long
                };
            } else {
                MapService.drawAccuracy(position.coords.accuracy);
            }
        };

        console.warn("TODO: test function geolocationTimedOut")
        function geolocationTimedOut(error) {
            console.log("timeout");
            console.log(error);
            console.log("Restarting geolocalization");
            watchInterval = $cordovaGeolocation.watchPosition({
                timeout: geolocationTimeoutTime,
                enableHighAccuracy: true
            }).then(
                null,
                geolocationTimedOut,
                positionCallback);
        };

        function turnOffRotationAndFollow() {
            if (geolocationState.isRotating) {
                console.warn("TODO: add orientationWatch");
                if (state.orientationWatch) {
                    state.orientationWatch.clearWatch();
                }
                state.orientationWatch = null;
                geolocationState.isRotating = false;
                MapService.mapIsRotating(geolocationState.isRotating);
            }

            geolocationState.isFollowing = false;

            setTimeout(function () {
                MapService.setBearing(-359.95);
                MapService.setBearing(-359.97);
                MapService.setBearing(-359.99);
            }, 100);
        };

        function activateRotation() {
            var defer = $q.defer();

            if (!state.orientationWatch) {
                state.lpf = new LPF(0.5);

                geolocationState.isRotating = true;
                MapService.mapIsRotating(geolocationState.isRotating);

                state.orientationWatch = $cordovaDeviceOrientation.watchHeading({
                    frequency: 80,
                    // filter: true // when true, the frequecy is ignored
                });
                state.orientationWatch.then(
                    null,
                    function (error) {
                        if (geolocationState.isRotating) {
                            geolocationState.isRotating = false;
                            MapService.mapIsRotating(geolocationState.isRotating);
                        }
                        defer.reject(error);
                        console.error(error);
                    },
                    function (result) {
                        if (!geolocationState.isRotating) {
                            geolocationState.isRotating = true;
                            MapService.mapIsRotating(geolocationState.isRotating);
                        }

                        if (Math.abs(result.magneticHeading - state.lastHeading) > 100) {
                            state.lpf = new LPF(0.5);
                            state.lpf.init(Array(6).fill(result.magneticHeading));
                        }

                        console.warn("TODO: add isLandscape or check if it's not necessary")
                        // heading = isLandscape() ? state.lpf.next(result.magneticHeading) + window.orientation : state.lpf.next(result.magneticHeading);
                        var heading = state.lpf.next(result.magneticHeading);
                        MapService.setBearing(-heading);
                        state.lastHeading = heading;

                        defer.resolve();
                    });
            }

            return defer.promise;
        };

        console.warn("TODO: complete function GPSSettingsSwitched")
        function GPSSettingsSwitched(state) {
            if ((device.platform === "Android" && state !== cordova.plugins.diagnostic.locationMode.LOCATION_OFF) ||
                (device.platform === "iOS" && (state === cordova.plugins.diagnostic.permissionStatus.GRANTED ||
                    state === cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE))
            ) {
                console.warn("TODO: enable navigation");
                gpsActive = true;
            }
            else {
                console.warn("TODO: stop navigation until gps reactivated")
                gpsActive = false;
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

                if (gpsActive) {
                    console.warn("TODO: activate geolocation");
                    geolocationState.isLoading = true;
                    $cordovaGeolocation
                        .getCurrentPosition({
                            timeout: constants.geolocationTimeoutTime,
                            enableHighAccuracy: false
                        })
                        .then(function (position) {
                            var lat = position.coords.latitude,
                                long = position.coords.longitude;

                            geolocationState.isLoading = false;

                            if (!MapService.isInBoundingBox(lat, long)) {
                                console.warn("TODO: handle outside bbox")
                                // vm.isOutsideBoundingBox = true;
                                state.lastPosition = null;
                                MapService.removePosition();
                                defer.reject("you are outside bounding box")
                                // $ionicPopup.alert({
                                //     title: $translate.instant("ATTENZIONE"),
                                //     template: $translate.instant("Sembra che tu sia fuori dai limiti della mappa")
                                // });
                                return;
                            }
                            else {
                                state.lastPosition = position;

                                MapService.drawPosition(position);

                                console.warn("TODO: Add function centerOnCoorsWithoutZoomEvent");
                                // centerOnCoorsWithoutZoomEvent(lat, long);
                                MapService.centerOnCoords(lat, long);

                                geolocationState.isActive = true;
                                geolocationState.isFollowing = true;
                                geolocationState.isRotating = false;

                                state.watchInterval = $cordovaGeolocation.watchPosition({
                                    timeout: constants.geolocationTimeoutTime,
                                    enableHighAccuracy: true
                                }).then(
                                    null,
                                    geolocationTimedOut,
                                    positionCallback);

                                defer.resolve();
                            }
                        }, function (err) {
                            geolocationState.isLoading = false;
                            defer.reject(err);
                            // $ionicPopup.alert({
                            //     title: $translate.instant("ATTENZIONE"),
                            //     template: $translate.instant("Si è verificato un errore durante la geolocalizzazione, riprova")
                            // });
                        });
                }
                else {
                    return checkGPS().then(geolocationService.enable);
                }
            }
            else {
                defer.reject("Cordova not available");
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
                cordova.plugins.diagnostic.registerLocationStateChangeHandler(false);
            }
            return false;
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
         * @returns {boolean}
         *      true if all correct, false otherwise
         * 
         * @example geolocationService.enable()
         *      goes to geolocationState 1.1
         * 
         * @example geolocationService.enable({isFollowing: true, isRotating: true})
         *      goes to geolocationState 4.1
         */
        geolocationService.switchState = function (goalState) {
            var defer = $q.defer();

            if (goalState) {
                state.goalState = goalState;
            }

            if (!gpsActive) {
                return checkGPS().then(switchState);
            }

            if (geolocationState.isLoading) {
                defer.reject("Already waiting for position");
            }


            if (state.goalState) {
                console.warn("TODO: reach goalState")
            }

            console.warn("TODO: add lastLocation");
            if (state.lastPosition && !geolocationState.isFollowing) {
                geolocationState.isFollowing = true;
                console.warn("TODO: add function centerOnCoordsWithoutZoomEvent");
                // centerOnCoordsWithoutZoomEvent(state.lastLocation.lat, state.lastLocation.long);
                MapService.centerOnCoords(lat, long);
                defer.resolve();
            }

            if (geolocationState.isRotating) {
                turnOffRotationAndFollow();
                defer.resolve();
            }
            else if (geolocationState.isFollowing) {
                console.warn("TODO: set state 4.1 - Activate rotation");
            }
            else {
                console.warn("TODO: set state 1.1 - activate follow");
                geolocationState.isFollowing = true;
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
         * @returns {boolean}
         *      true if all correct, false otherwise
         */
        geolocationService.startRecording = function (recordTrack) {
            return false;
        };

        /**
         * @description
         * Pause the stats record saving the state
         * 
         * @returns {boolean}
         *      true if all correct, false otherwise
         */
        geolocationService.pauseRecording = function () {
            return false;
        };

        /**
         * @description
         * Resume to record stats from the last saved moment
         * 
         * @returns {boolean}
         *      true if all correct, false otherwise
         */
        geolocationService.resumeRecording = function () {
            return false;
        };

        /**
         * @description
         * Stop to record stats from the last saved moment
         * 
         * @returns {boolean}
         *      all the recorded stats
         */
        geolocationService.stopRecording = function () {
            return false;
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
            return false;
        };

        /**
         * @description
         * Start the remote tracking with our server
         * 
         * @returns {boolean}
         *      true if started correctly, false otherwise
         */
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
        geolocationService.stopRemoteTracking = function () {
            return false;
        };

        return geolocationService;
    });