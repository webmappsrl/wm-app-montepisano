angular.module('webmapp')

.factory('GeolocationService', function GeolocationService(
    $q,
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

    //Contains all the global variables
    var state = {};

    function resetStats () {
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
    function checkGPS () {
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

    function locationCallback (location) {

    };

    function turnOffRotationAndFollow () {
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

    function GPSSettingsSwitched (state) {
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
     *      true if all correct, false otherwise
     * 
     * @example geolocationService.enable()
     *      goes to geolocationState 1.1
     * 
     * @example geolocationService.enable({isFollowing: true, isRotating: true})
     *      goes to geolocationState 4.1
     */
    geolocationService.enable = function () {
        var defer = $q.defer();
        if (window.cordova) {
            //To prevent duplication, firstly deregistrer listener
            cordova.plugins.diagnostic.registerLocationStateChangeHandler(false);
            cordova.plugins.diagnostic.registerLocationStateChangeHandler(GPSSettingsSwitched);

            if (gpsActive) {
                console.warn("TODO: activate geolocation");
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
        if (!gpsActive) {
            if (state) {
                state.goalState = goalState;
            }
            checkGPS().then(switchState);
            return;
        }
    
        if (geolocationState.isLoading) {
            return;
        }
    
        console.warn("TODO: add function centerOnCoordsWithoutZoomEvent");
        console.warn("TODO: add lastLocation");
        if (state.lastLocation && !geolocationState.isFollowing) {
            geolocationState.isFollowing = true;
            centerOnCoordsWithoutZoomEvent(state.lastLocation.lat, state.lastLocation.long);
            return;
        }
    
        if (geolocationState.isRotating) {
            turnOffRotationAndFollow();
        }
        else if (geolocationState.isFollowing) {
            console.warn("TODO: set state 4.1");
        }
        else {
            console.warn("TODO: set state 1.1");
        }
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