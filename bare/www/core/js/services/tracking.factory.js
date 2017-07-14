/*global angular, ionic, L*/

angular.module('webmapp')

.factory('Tracking', function Tracking(
    $q,
    $http,
    $window,
    Auth,
    MapService,
    $ionicPlatform,
    $cordovaGeolocation,
    CONFIG
) {
    var tracking = {};

    var _state = {},
        mapBounds = CONFIG.MAP.bounds,
        northEast = L.latLng(mapBounds.northEast),
        southWest = L.latLng(mapBounds.southWest),
        maxBounds = L.latLngBounds(southWest, northEast),
        mapCenter = maxBounds.getCenter(),
        radius = northEast.distanceTo(L.latLng(mapCenter)),
        bgGeo, pausedTime;

    var posOptions = {
        timeout: 10000,
        enableHighAccuracy: false
    };

    $window.localStorage.lastSent = $window.localStorage.lastSent || Date.now();

    tracking.state = _state;
    tracking.options = CONFIG.TRACKING || {};

    tracking.start = function() {
        if (tracking.options.logging) {
            console.log('RequestStart');
        }

        if (tracking.options.active && !_state.ready) {
            tracking.enable();
            return;
        }

        tracking.sync();

        if (_state.ready && !_state.running) {
            bgGeo.getCurrentPosition(function(location, taskId) { // or $cordovaGeolocation.getCurrentPosition(posOptions).then(function(location) {
                var isInBoundingBox = MapService.isInBoundingBox(location.coords.latitude, location.coords.longitude);

                if (!_state.running) {
                    if (isInBoundingBox) {
                        _state.running = true;
                        bgGeo.start();
                        if (tracking.options.logging) {
                            console.log('START');
                        }
                    } else {
                        tracking.stop(true);
                        if (tracking.options.logging) {
                            console.log('STOP');
                        }
                    }
                }

                bgGeo.finish(taskId);
            });
        }
    };

    tracking.sync = function() {
        var defer = $q.defer();

        var userData = Auth.getUserData(),
            // token = userData.api_token,
            // sessionId = userData.sessid,
            uid;

        if (userData.user) {
            uid = userData.user.uid;
        }

        // TODO: check online status (?)
        // isOnline = $cordovaNetwork.isOnline();
        if (tracking.options.sync) {
            bgGeo.getLocations(function(locations, taskId) {
                try {
                    if (tracking.options.logging) {
                        console.log('locations count: ' + locations.length);
                        console.log('locations by sync string: ' + JSON.stringify(locations));
                    }

                    if (!_state.syncing) {
                        if (locations.length === 0) {
                            defer.resolve();
                        } else {
                            _state.syncing = true;
                            $http({
                                method: 'POST',
                                url: tracking.options.syncUrl,
                                dataType: 'json',
                                crossDomain: true,
                                data: {
                                    locations: locations,
                                    info: {
                                        uid: uid,
                                        app_id: tracking.options.appId,
                                        device: ionic.Platform.device()
                                    }
                                },
                                headers: {
                                    'Content-Type': 'application/json'
                                        // 'X-USER-SESSION-TOKEN': sessionId,
                                        // 'X-CSRF-Token' : token
                                }
                            }).success(function(data) {
                                if (tracking.options.logging) {
                                    console.log('Sync done');
                                }
                                $window.localStorage.lastSent = Date.now();
                                bgGeo.clearDatabase();
                                defer.resolve(data);
                                _state.syncing = false;
                            }).error(function(error) {
                                if (tracking.options.logging) {
                                    console.log('Sync error');
                                }
                                defer.reject(error);
                                _state.syncing = false;
                            });
                        }
                    }
                } catch (e) {
                    defer.reject(e);
                }

                bgGeo.finish(taskId);
            });
        } else {
            defer.reject();
        }

        return defer.promise;
    };

    tracking.stop = function(skipSync) {
        _state.running = false;
        bgGeo.stop();

        if (typeof skipSync === 'undefined') {
            tracking.sync();
        }
    };

    tracking.disable = function() {
        _state.ready = false;
    };

    tracking.enable = function() {
        // if (!Auth.isLoggedIn()) {
        //     return;
        // }

        if (_state.ready || !tracking.options.active) {
            return;
        }

        ionic.Platform.ready(onPlatformReady);

        function onPlatformReady() {
            if (window.BackgroundFetch) {
                configureBackgroundFetch();
            }

            // Configure BackgroundGeolocation
            if (!window.BackgroundGeolocation) {
                // console.warn('Could not detect BackgroundGeolocation API');
                return;
            }

            configureBackgroundGeolocation();
        }

        function configureBackgroundFetch() {
            if (tracking.options.backgroundFetch === false) {
                return;
            }

            var Fetcher = window.BackgroundFetch;

            // Your background-fetch handler.
            var fetchCallback = function() {
                if (tracking.options.logging) {
                    console.log('BackgroundFetch initiated');
                }
                doCheck();
                Fetcher.finish();
            };

            var failureCallback = function() {
                if (tracking.options.logging) {
                    console.log('BackgroundFetch failed');
                }
            };

            Fetcher.configure(fetchCallback, failureCallback, {
                stopOnTerminate: false
            });
        }

        function configureBackgroundGeolocation() {
            var config = tracking.options.config;

            bgGeo = window.BackgroundGeolocation;

            // Other events: motionchange, geofence, http, heartbeat, schedule, activitychange
            bgGeo.on('location', onLocation);
            bgGeo.on('providerchange', onProviderChange);
            bgGeo.on('heartbeat', onHeartbeat);

            bgGeo.configure(config, function(state) {
                _state.ready = true;

                if (tracking.options.config.debug) {
                    $cordovaGeolocation.getCurrentPosition(posOptions)
                        .then(function(location) {
                            console.log(location);
                        });
                }

                bgGeo.removeGeofences(function() {
                    bgGeo.addGeofences([{
                        // loiteringDelay: 30000, // <-- 30 seconds
                        identifier: 'MapArea',
                        radius: radius,
                        latitude: mapCenter.lat,
                        longitude: mapCenter.lng,
                        notifyOnEntry: true,
                        notifyOnExit: true,
                        notifyOnDwell: false
                    }]);
                    bgGeo.onGeofence(onGeofence);
                }, function(error) {
                    if (tracking.options.logging) {
                        console.warn('Failed to remove geofence', error);
                    }
                });

                tracking.start();
            });
        }

        function onHeartbeat(params) {
            if (tracking.options.logging) {
                console.log('- heartbeat: ', params);
            }
            doCheck();
        }

        function onGeofence(params, taskId) {
            try {
                var location = params.location,
                    identifier = params.identifier,
                    action = params.action;

                if (identifier === 'MapArea') {
                    if (action === 'ENTER') {
                        tracking.start();
                    } else if (action === 'EXIT') {
                        tracking.stop();
                    }
                }

                if (tracking.options.logging) {
                    console.log('ENTER or EXIT?: ', action);
                }
                bgGeo.finish(taskId);
            } catch (e) {
                if (tracking.options.logging) {
                    console.error('An error occurred in the application code', e);
                }
            }

            bgGeo.finish(taskId);
        }

        // function onLocationError(error) {
        //     console.error('Location error: ', error);
        // }

        function onLocation(location, taskId) {
            if (tracking.options.logging) {
                console.log('location: ', location);
            }

            doCheck();
            bgGeo.finish(taskId);
        }

        function onProviderChange(provider) {
            if (tracking.options.logging) {
                console.info('Location provider change: ', provider);
            }
        }

        function doCheck() {
            var lastSent = Number($window.localStorage.lastSent) || Date.now();

            var diff = Math.abs(lastSent - Date.now()),
                minutes = Math.floor((diff / 1000) / 60);

            bgGeo.getCount(function(count) {
                if (count >= tracking.options.maxBatchItems ||
                    minutes >= tracking.options.syncIntervalInMinutes) {
                    tracking.sync();
                }
            });

            if (tracking.options.logging) {
                console.log('minutes: ' + minutes);
            }
        }
    };

    $ionicPlatform.ready(function() {
        $ionicPlatform.on('resume', function() {
            tracking.start();
        });

        $ionicPlatform.on('pause', function() {
            pausedTime = Date.now();
        });
    });


    return tracking;
});