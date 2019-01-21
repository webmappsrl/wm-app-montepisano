describe('Geolocation.Factory', function () {
    var GeolocationService,
        CONFIG,
        $cordovaDeviceOrientation,
        $cordovaGeolocation,
        $httpBackend,
        $ionicPopup,
        $q,
        $rootScope,
        $ionicPlatform,
        MapService,
        $httpBackend,
        Utils,
        spy = {},
        callPositionCallback;
    var currentLat, currentLong;

    /* Copied from geolocation factory. It must be a copy of the original
     * one in the factory except for the outOfTrackDistance, that is initialized
     * in a beforeEach
     */
    var constants = {
        compassRotationTimeout: 8000, // Time in milliseconds to wait before switching from gps rotation to compass rotation
        currentSpeedTimeWindow: 10000, // Time in milliseconds window of positions to calculate currentSpeed with
        geolocationTimeoutTime: 60000,
        minSpeedForGpsBearing: 2, // Speed in km/h needed to switch from compass to gps bearing
        outOfTrackToastDelay: 10000,
        outOfTrackDistance: 200
    };

    beforeEach(module('webmapp'));

    beforeEach(function () {
        CONFIG = angular.copy(MOCK_CONFIG);

        CONFIG.GEOLOCATION = {
            enable: true,
            navigation: {
                trackBoundsDistance: 200
            },
            record: {
                enable: true
            }
        };

        constants.outOfTrackDistance = 200;

        currentLat = CONFIG.MAP.bounds.northEast[0] + (CONFIG.MAP.bounds.southWest[0] - CONFIG.MAP.bounds.northEast[0]) / 2;
        currentLong = CONFIG.MAP.bounds.northEast[1] + (CONFIG.MAP.bounds.southWest[1] - CONFIG.MAP.bounds.northEast[1]) / 2;

        module(function ($provide) {
            $provide.value('CONFIG', CONFIG);
        });
    });

    beforeEach(function () {
        window.cordova = {
            plugins: {
                diagnostic: {
                    permissionStatus: {
                        GRANTED: 1,
                        GRANTED_WHEN_IN_USE: 2,
                        DENIED: 3,
                        DENIED_ALWAYS: 4
                    },
                    locationAuthorizationMode: {
                        ALWAYS: 1
                    },
                    locationMode: {
                        LOCATION_ON: 1,
                        LOCATION_OFF: 0
                    },
                    status: 1,
                    locationEnableParam: true,
                    locationAuthorized: false,
                    gpsStateChangeCallback: null,
                    registerLocationStateChangeHandler: function (callback) {
                        this.gpsStateChangeCallback = callback;
                        return true;
                    },
                    isLocationAuthorized: function (callback) {
                        callback()
                    },
                    requestLocationAuthorization: function (callback, error, param) {
                        callback(this.status)
                    },
                    isGpsLocationEnabled: function (callback, err, param) {
                        callback(this.locationEnableParam);
                    },
                    isLocationEnabled: function (callback, err, param) {
                        callback(this.locationEnableParam);
                    },
                    switchToSettings: function () { },
                    switchToLocationSettings: function () { }
                }
            },
            platformId: 'android'
        };
        BackgroundGeolocation = {
            FOREGROUND_MODE: 1,
            BACKGROUND_MODE: 0,
            activeInBackground: false,
            backgroundSavedPositions: [],
            start: function () { },
            stop: function () { },
            removeAllListeners: function (event) {
                delete this.callbackFun[event];
            },
            events: [],
            startTask: function (callback) {
                callback();
            },
            endTask: function () { },
            configure: function (params) { },
            on: function (event, callback) {
                switch (event) {
                    case 'location':
                    case 'stationary':
                    case 'error':
                    case 'background':
                    case 'foreground':
                        this.callbackFun[event] = callback;
                        this.events.push(event);
                        break;
                    default:
                        break;
                }
            },
            checkStatus: function (callback) {
                callback({ isRunning: this.activeInBackground })
            },
            getLocations: function (callback) {
                callback(this.backgroundSavedPositions);
            },
            switchMode: function (params) { },
            callbackFun: {}
        };
        $ionicPlatform = {
            ready: function (callback) {
                callback();
                return;
            }
        };

        callPositionCallback = function (lat, long, bearing, speed, time, altitude, accuracy) {
            var position = {
                latitude: lat,
                longitude: long,
                bearing: bearing ? bearing : null,
                speed: speed ? speed : 0,
                altitude: altitude ? altitude : 0,
                accuracy: accuracy ? accuracy : 10
            };

            if (bearing) {
                position.bearing = bearing;
            }
            if (speed) {
                position.speed = speed;
            }
            if (time) {
                position.time = time;
            }

            if (BackgroundGeolocation.callbackFun['location']) {
                BackgroundGeolocation.callbackFun['location'](position);
            }
        };
    });

    beforeEach(inject(function (_GeolocationService_, _$cordovaGeolocation_, _$cordovaDeviceOrientation_, _$ionicPopup_, _$q_, _$translate_, _$rootScope_, _MapService_, _$httpBackend_, _Utils_) {
        GeolocationService = _GeolocationService_;
        $cordovaDeviceOrientation = _$cordovaDeviceOrientation_;
        $cordovaGeolocation = _$cordovaGeolocation_;
        $ionicPopup = _$ionicPopup_;
        $q = _$q_;
        $translate = _$translate_;
        MapService = _MapService_;
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
        Utils = _Utils_;
        $httpBackend.whenGET().respond(404);
    }));

    beforeEach(function () {
        spy['drawPosition'] = spyOn(MapService, 'drawPosition').and.callFake(function () {
            return true;
        });
        spyOn(MapService, 'drawAccuracy').and.callFake(function () {
            return true;
        });
        spyOn(MapService, 'removePosition').and.callFake(function () {
            return true;
        });
        spyOn(MapService, 'centerOnCoords').and.callFake(function () {
            return true;
        });
        spyOn(MapService, 'getZoom').and.callFake(function () {
            return true;
        });
        spy['mapIsRotating'] = spyOn(MapService, 'mapIsRotating').and.callFake(function () {
            return true;
        });
        spyOn(MapService, 'triggerNearestPopup').and.callFake(function () {
            return true;
        });
        spy['hasMap'] = spyOn(MapService, 'hasMap').and.callFake(function () {
            return true;
        });
        spy['createUserPolyline'] = spyOn(MapService, 'createUserPolyline').and.callFake(function () { });
        spyOn(MapService, 'updateUserPolyline').and.callFake(function () { });
        spyOn(MapService, 'getUserPolyline').and.callFake(function () { });
        spyOn(MapService, 'removeUserPolyline').and.callFake(function () { });
        spyOn($ionicPopup, 'confirm').and.callFake(function () {
            var defer = $q.defer();
            defer.resolve(true);
            return defer.promise;
        });
        spyOn($ionicPopup, 'alert').and.callFake(function () {
            var defer = $q.defer();
            defer.resolve(true);
            return defer.promise;
        });
    });

    describe('enable', function () {
        it('cordova is not defined => it should reject promise', function (done) {
            window.cordova = undefined;
            expect(GeolocationService.isActive()).toBe(false);
            GeolocationService.enable().then(function () {
                done.fail("it should not be resolved");
            }).catch(function (err) {
                expect(err).toEqual(ERRORS.CORDOVA_UNAVAILABLE);
                done();
            });

            $httpBackend.flush();
        });

        it('cordova is defined, platform android, permission granted, isGpsLocationEnabled => it should resolve promise and return true', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                defer.resolve({
                    coords: {
                        latitude: currentLat,
                        longitude: currentLong,
                        altitude: 0,
                        accuracy: 10
                    }
                });
                return defer.promise;
            });

            localStorage.clear();

            var expectedState = {
                isActive: true,
                isLoading: false,
                isFollowing: true,
                isRotating: false
            };

            window.cordova.platformId = 'android';
            expect(GeolocationService.isActive()).toBe(false);

            GeolocationService.enable()
                .then(function (value) {
                    expect(value).toEqual(expectedState);
                    expect(GeolocationService.isActive()).toBe(true);
                    done();
                }).catch(function (err) {
                    fail("it should be resolved");
                })

            $httpBackend.flush();
        });

        it('cordova is defined, platform ios, permission granted, isLocationEnabled => it should resolve promise and return true', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                defer.resolve({
                    coords: {
                        latitude: currentLat,
                        longitude: currentLong,
                        altitude: 0,
                        accuracy: 10
                    }
                });
                return defer.promise;
            });

            localStorage.clear();

            var expectedState = {
                isActive: true,
                isLoading: false,
                isFollowing: true,
                isRotating: false
            };

            window.cordova.platformId = 'ios';
            expect(GeolocationService.isActive()).toBe(false);

            GeolocationService.enable()
                .then(function (value) {
                    expect(value).toEqual(expectedState);
                    expect(GeolocationService.isActive()).toBe(true);
                    done();
                }).catch(function (err) {
                    fail("it should be resolved");
                })

            $httpBackend.flush();
        });

        it('cordova is defined, platform android, permission granted, not isGPSLocationEnabled => it should not resolve promise and return error message', function (done) {
            localStorage.clear();

            window.cordova.plugins.diagnostic.locationEnableParam = false;
            GeolocationService.enable()
                .then(function (value) {
                    fail("it should not be resolved");
                    done();
                }).catch(function (err) {
                    expect(err).toEqual(ERRORS.GPS_DISABLED);
                    expect(GeolocationService.isActive()).toBe(false);
                    done();
                })

            $httpBackend.flush();
        });

        it('cordova is defined, platform ios, permission granted, not isLocationEnabled => it should not resolve promise and return error message', function (done) {
            localStorage.clear();

            window.cordova.platformId = 'ios';
            window.cordova.plugins.diagnostic.locationEnableParam = false;
            GeolocationService.enable()
                .then(function (value) {
                    fail("it should not be resolved");
                }).catch(function (err) {
                    expect(err).toEqual(ERRORS.GPS_DISABLED);
                    expect(GeolocationService.isActive()).toBe(false);
                    done();
                })

            $httpBackend.flush();
        });

        it('cordova is defined, platform android, permission DENY => it should not resolve promise and return error message', function (done) {
            localStorage.clear();

            window.cordova.platformId = 'android';
            window.cordova.plugins.diagnostic.status = window.cordova.plugins.diagnostic.permissionStatus.DENIED;
            GeolocationService.enable()
                .then(function (value) {
                    fail("it should not be resolved");
                }).catch(function (err) {
                    expect(err).toEqual(ERRORS.GPS_PERMISSIONS_DENIED);
                    expect(GeolocationService.isActive()).toBe(false);
                    done();
                })

            $httpBackend.flush();
        });

        it('cordova is defined, platform ios, permission DENY => it should not resolve promise and return error message', function (done) {
            localStorage.clear();

            window.cordova.platformId = 'ios';
            window.cordova.plugins.diagnostic.status = window.cordova.plugins.diagnostic.permissionStatus.DENIED;
            GeolocationService.enable()
                .then(function (value) {
                    fail("it should not be resolved");
                }).catch(function (err) {
                    expect(err).toEqual(ERRORS.GPS_PERMISSIONS_DENIED);
                    expect(GeolocationService.isActive()).toBe(false);
                    done();
                })

            $httpBackend.flush();
        });

        it('cordova is defined, platform android, permission DENIED_ALWAYS => it should not resolve promise and return error message', function (done) {
            localStorage.clear();

            window.cordova.platformId = 'android';
            window.cordova.plugins.diagnostic.status = window.cordova.plugins.diagnostic.permissionStatus.DENIED_ALWAYS;
            GeolocationService.enable()
                .then(function (value) {
                    fail("it should not be resolved");
                }).catch(function (err) {
                    expect(err).toEqual(ERRORS.GPS_PERMISSIONS_DENIED);
                    expect(GeolocationService.isActive()).toBe(false);
                    done();
                })

            $httpBackend.flush();
        });

        it('cordova is defined, platform ios, permission DENIED_ALWAYS => it should not resolve promise and return error message', function (done) {
            localStorage.clear();

            window.cordova.platformId = 'ios';
            window.cordova.plugins.diagnostic.status = window.cordova.plugins.diagnostic.permissionStatus.DENIED;
            localStorage.$wm_ios_location_permission_denied = JSON.stringify(true);
            GeolocationService.enable()
                .then(function (value) {
                    fail("it should not be resolved");
                }).catch(function (err) {
                    expect(err).toEqual(ERRORS.GPS_PERMISSIONS_DENIED);
                    expect(GeolocationService.isActive()).toBe(false);
                    done();
                })

            $httpBackend.flush();
        });

        it('cordova is defined, platform android, permission already granted => it should resolve promise and return status', function (done) {
            localStorage.clear();

            window.cordova.platformId = 'android';
            window.cordova.plugins.diagnostic.isLocationAuthorized = function (callback) {
                callback(true);
            };

            var expectedStatus = {
                isActive: true,
                isLoading: true,
                isFollowing: false,
                isRotating: false
            };

            GeolocationService.enable()
                .then(function (value) {
                    expect(value).toEqual(expectedStatus);
                    done();
                }).catch(function (err) {
                    fail("it should not be rejected");
                });

            $httpBackend.flush();
        });

        it('cordova is defined, platform ios, permission already granted => it should resolve and return status', function (done) {
            localStorage.clear();

            window.cordova.platformId = 'ios';
            window.cordova.plugins.diagnostic.isLocationAuthorized = function (callback) {
                callback(true);
            };

            var expectedStatus = {
                isActive: true,
                isLoading: true,
                isFollowing: false,
                isRotating: false
            };

            GeolocationService.enable()
                .then(function (value) {
                    expect(value).toEqual(expectedStatus);
                    done();
                }).catch(function (err) {
                    fail("it should not be rejected");
                });

            $httpBackend.flush();
        });

        it('cordova is defined, gps already active => it should not resolve promise and return error message', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                defer.resolve({
                    coords: {
                        latitude: currentLat,
                        longitude: currentLong,
                        altitude: 0,
                        accuracy: 10
                    }
                });
                return defer.promise;
            });

            localStorage.clear();

            var expectedState = {
                isActive: true,
                isLoading: false,
                isFollowing: true,
                isRotating: false
            };

            expect(GeolocationService.isActive()).toBe(false);

            GeolocationService.enable()
                .then(function (value) {
                    expect(value).toEqual(expectedState);
                    expect(GeolocationService.isActive()).toBe(true);
                    GeolocationService.enable().then(function (res) {
                        expect(GeolocationService.isActive()).toBe(true);
                        expect(res.isActive).toBe(true);
                        done();
                    }).catch(function () {
                        fail("it should resolve promise");
                    })
                }).catch(function (err) {
                    fail("it should resolve first promise and reject second");
                })

            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('disable', function () {
        it('window.cordova is defined => it should disable geolocation, call MapService.removePosition', function () {
            var value = GeolocationService.disable();
            expect(value).toBe(true);
            expect(MapService.removePosition).toHaveBeenCalled();
            expect(GeolocationService.isActive()).toBe(false);

            $httpBackend.flush();
        });

        it('window.cordova is undefined => it should resolve promise and return true', function () {
            expect(GeolocationService.isActive()).toBe(false);
            var value = GeolocationService.disable();
            expect(value).toBe(true);
            expect(GeolocationService.isActive()).toBe(false);

            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('switchState', function () {
        it('GPS is not active => it should reject promise and return error message', function (done) {
            expect(GeolocationService.isActive()).toBe(false);
            var promise = GeolocationService.switchState({});
            promise.then(function (val) {
                fail('it should reject promise');
            }).catch(function (err) {
                expect(err).toEqual(ERRORS.GPS_DISABLED);
                done();
            });

            $httpBackend.flush();
        });

        it('no param, state === isActive && isLoading && !isFollowing && !isRotating => it should resolve promise with current state', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function (params) {
                var defer = $q.defer();
                GeolocationService.switchState()
                    .then(function (val) {
                        expect(expectedState).toEqual(val);
                        defer.resolve({
                            coords: {
                                latitude: currentLat,
                                longitude: currentLong,
                                altitude: 0,
                                accuracy: 10
                            }
                        });
                        done();
                    }).catch(function (err) {
                        fail('it should resolve promise');
                    });


                return defer.promise;
            });

            var expectedState = {
                isActive: true,
                isLoading: true,
                isFollowing: false,
                isRotating: false
            };
            expect(GeolocationService.isActive()).toBe(false);
            //call get current position and resolve promise
            GeolocationService.enable().then(function () { });

            $httpBackend.flush();
        });

        it('no param, state === isActive && !isLoading && !isFollowing && !isRotating  => it should switch state to follow and return modified state', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                defer.resolve({
                    coords: {
                        latitude: currentLat,
                        longitude: currentLong,
                        altitude: 0,
                        accuracy: 10
                    }
                });
                return defer.promise;
            });
            spyOn($cordovaDeviceOrientation, 'watchHeading').and.callFake(function () {
                var defer = $q.defer();
                var obj = {};
                defer.resolve(
                    obj
                );
                defer.promise.watch = obj;
                defer.promise.clearWatch = function () {
                    delete defer.promise.watch
                };
                return defer.promise;
            });

            var expectedState = {
                isActive: true,
                isLoading: false,
                isFollowing: true,
                isRotating: false
            };

            expect(GeolocationService.isActive()).toBe(false);
            GeolocationService.enable().then(function () {
                expect(GeolocationService.isActive()).toBe(true);
                GeolocationService.switchState()
                    .then(function (val) {
                        var middleState = {
                            isActive: true,
                            isLoading: false,
                            isFollowing: true,
                            isRotating: true
                        }
                        expect(middleState).toEqual(val);
                        GeolocationService.switchState().then(function (val) {
                            var rotationState = {
                                isActive: true,
                                isLoading: false,
                                isFollowing: true,
                                isRotating: false
                            }
                            expect(rotationState).toEqual(val);
                            done();
                        })
                    }).catch(function (err) {
                        fail('it should resolve promise');
                    });

            });

            $httpBackend.flush();
        });

        it('no param, state === isActive && !isLoading && isFollowing && !isRotating  => it should enable rotation and return modified state', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                defer.resolve({
                    coords: {
                        latitude: currentLat,
                        longitude: currentLong,
                        altitude: 0,
                        accuracy: 10
                    }
                });
                return defer.promise;
            });
            spyOn($cordovaDeviceOrientation, 'watchHeading').and.callFake(function () {
                var defer = $q.defer();
                var obj = {};
                defer.resolve(
                    obj
                );
                defer.promise.watch = obj;
                defer.promise.clearWatch = function () {
                    delete defer.promise.watch
                };
                return defer.promise;
            });

            var expectedState = {
                isActive: true,
                isLoading: false,
                isFollowing: true,
                isRotating: true
            };
            expect(GeolocationService.isActive()).toBe(false);
            GeolocationService.enable().then(function () {
                GeolocationService.switchState().then(function (val) {
                    expect(val).toEqual(expectedState);
                    done();
                }).catch(function (err) {
                    fail('it should resolve promise');
                });
            });

            $httpBackend.flush();
        });

        it('no param, state === isActive && !isLoading && isFollowing && isRotating  => it should disable rotation and return modified state', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                defer.resolve({
                    coords: {
                        latitude: currentLat,
                        longitude: currentLong,
                        altitude: 0,
                        accuracy: 10
                    }
                });
                return defer.promise;
            });
            spyOn($cordovaDeviceOrientation, 'watchHeading').and.callFake(function () {
                var defer = $q.defer();
                var obj = {};
                defer.resolve(
                    obj
                );
                defer.promise.watch = obj;
                defer.promise.clearWatch = function () {
                    delete defer.promise.watch
                };
                return defer.promise;
            });

            var expectedState = {
                isActive: true,
                isLoading: false,
                isFollowing: true,
                isRotating: false
            };

            expect(GeolocationService.isActive()).toBe(false);
            GeolocationService.enable().then(function () {
                done();
                GeolocationService.switchState()
                    .then(function (value) {
                        GeolocationService.switchState()
                            .then(function (val) {
                                done();
                                expect(val).toEqual(expectedState);
                            }).catch(function (err) {
                                fail('it should resolve promise');
                            })
                    }).catch(function (err) {
                        fail('it should resolve promise');
                    });
            });

            $httpBackend.flush();
        });

        it('goalState = isFollowing && !isRotating, state === isActive && !isLoading && isFollowing && isRotating  => it should disable rotation and return modified state', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                defer.resolve({
                    coords: {
                        latitude: currentLat,
                        longitude: currentLong,
                        altitude: 0,
                        accuracy: 10
                    }
                });
                return defer.promise;
            });
            spyOn($cordovaDeviceOrientation, 'watchHeading').and.callFake(function () {
                var defer = $q.defer();
                var obj = {};
                defer.resolve(
                    obj
                );
                defer.promise.watch = obj;
                defer.promise.clearWatch = function () {
                    delete defer.promise.watch
                };
                return defer.promise;
            });

            var expectedState = {
                isActive: true,
                isLoading: false,
                isFollowing: true,
                isRotating: false
            };

            expect(GeolocationService.isActive()).toBe(false);
            GeolocationService.enable().then(function () {
                done();
                GeolocationService.switchState()
                    .then(function (value) {
                        done();
                        expect(value).toEqual({
                            isActive: true,
                            isLoading: false,
                            isFollowing: true,
                            isRotating: true
                        });
                        GeolocationService.switchState(expectedState)
                            .then(function (val) {
                                done();
                                expect(val).toEqual(expectedState);
                            }).catch(function () {
                                fail('it should resolve promise');
                            })
                    }).catch(function (err) {
                        fail('it should resolve promise');
                    });
            });

            $httpBackend.flush();
        });

        it('goalState = isFollowing && isRotating, state === isActive && !isLoading && isFollowing && isRotating  => it should no change nothing resolve with current state', function (done) {

            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                defer.resolve({
                    coords: {
                        latitude: currentLat,
                        longitude: currentLong,
                        altitude: 0,
                        accuracy: 10
                    }
                });
                return defer.promise;
            });
            spyOn($cordovaDeviceOrientation, 'watchHeading').and.callFake(function () {
                var defer = $q.defer();
                var obj = {};
                defer.resolve(
                    obj
                );
                defer.promise.watch = obj;
                defer.promise.clearWatch = function () {
                    delete defer.promise.watch
                };
                return defer.promise;
            });

            var expectedState = {
                isActive: true,
                isLoading: false,
                isFollowing: true,
                isRotating: true
            };

            expect(GeolocationService.isActive()).toBe(false);
            var enablePromise = GeolocationService.enable().then(function () {
                done();
                var promise = GeolocationService.switchState();
                promise.then(function (val) {
                    done();
                    var goalswitchState = GeolocationService.switchState(expectedState);
                    expect(val).toEqual(expectedState);
                    goalswitchState.then(function (val) {
                        done();
                        expect(val).toEqual(expectedState);
                    }).catch(function () {
                        fail('it should resolve promise');
                    })
                }).catch(function (err) {
                    fail('it should resolve promise');
                });
            });

            $httpBackend.flush();
        });

        it('goalState = !isFollowing && !isRotating, state === isActive && !isLoading && isFollowing && isRotating  => it should disable rotation and follow and resolve with modified state', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                defer.resolve({
                    coords: {
                        latitude: currentLat,
                        longitude: currentLong,
                        altitude: 0,
                        accuracy: 10
                    }
                });
                return defer.promise;
            });
            spyOn($cordovaDeviceOrientation, 'watchHeading').and.callFake(function () {
                var defer = $q.defer();
                var obj = {};
                defer.resolve(
                    obj
                );
                defer.promise.watch = obj;
                defer.promise.clearWatch = function () {
                    delete defer.promise.watch
                };
                return defer.promise;
            });

            var expectedState = {
                isActive: true,
                isLoading: false,
                isFollowing: false,
                isRotating: false
            };

            expect(GeolocationService.isActive()).toBe(false);
            GeolocationService.enable().then(function () {
                GeolocationService.switchState().then(function (val) {
                    GeolocationService.switchState(expectedState)
                        .then(function (val) {
                            expect(val).toEqual(expectedState);
                            done();
                        }).catch(function () {
                            fail('it should resolve promise');
                        })
                }).catch(function (err) {
                    fail('it should resolve promise');
                });
            });

            $httpBackend.flush();
        });

        it('goalState = isFollowing && !isRotating, state === isActive && !isLoading && isFollowing && !isRotating  => it should stay on the same state and resolve with current state', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                defer.resolve({
                    coords: {
                        latitude: currentLat,
                        longitude: currentLong,
                        altitude: 0,
                        accuracy: 10
                    }
                });
                return defer.promise;
            });

            var expectedState = {
                isActive: true,
                isLoading: false,
                isFollowing: true,
                isRotating: false
            };

            expect(GeolocationService.isActive()).toBe(false);
            GeolocationService.enable().then(function () {
                GeolocationService.switchState(expectedState)
                    .then(function (value) {
                        expect(value).toEqual(expectedState);
                        done();
                    }).catch(function (err) {
                        fail('it should resolve promise');
                    });
            });

            $httpBackend.flush();
        });

        it('goalState = isFollowing && isRotating, state === isActive && !isLoading && isFollowing && !isRotating  => it should start rotating and resolve with current state', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                defer.resolve({
                    coords: {
                        latitude: currentLat,
                        longitude: currentLong,
                        altitude: 0,
                        accuracy: 10
                    }
                });
                return defer.promise;
            });
            spyOn($cordovaDeviceOrientation, 'watchHeading').and.callFake(function () {
                var defer = $q.defer();
                var obj = {};
                defer.resolve(
                    obj
                );
                defer.promise.watch = obj;
                defer.promise.clearWatch = function () {
                    delete defer.promise.watch
                };
                return defer.promise;
            });

            var expectedState = {
                isActive: true,
                isLoading: false,
                isFollowing: true,
                isRotating: true
            };

            expect(GeolocationService.isActive()).toBe(false);
            GeolocationService.enable().then(function () {
                GeolocationService.switchState(expectedState).then(function (val) {
                    expect(val).toEqual(expectedState);
                    done();
                }).catch(function (err) {
                    fail('it should resolve promise');
                });
            });

            $httpBackend.flush();
        });

        it('goalState = !isFollowing && !isRotating, state === isActive && !isLoading && isFollowing && !isRotating  => it should disable rotation and follow and resolve with modified state', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                defer.resolve({
                    coords: {
                        latitude: currentLat,
                        longitude: currentLong,
                        altitude: 0,
                        accuracy: 10
                    }
                });
                return defer.promise;
            });

            spyOn($cordovaDeviceOrientation, 'watchHeading').and.callFake(function () {
                var defer = $q.defer();
                var obj = {};
                defer.resolve(
                    obj
                );
                defer.promise.watch = obj;
                defer.promise.clearWatch = function () {
                    delete defer.promise.watch
                };
                return defer.promise;
            });

            var expectedState = {
                isActive: true,
                isLoading: false,
                isFollowing: false,
                isRotating: false
            };

            expect(GeolocationService.isActive()).toBe(false);
            GeolocationService.enable().then(function () {
                GeolocationService.switchState(expectedState).then(function (val) {
                    expect(val).toEqual(expectedState);
                    done();
                }).catch(function (err) {
                    fail('it should resolve promise');
                });
            });

            $httpBackend.flush();
        });

        it('goalState = isFollowing && !isRotating, state === isActive && !isLoading && !isFollowing && !isRotating  => it should start following and resolve with current state', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                defer.resolve({
                    coords: {
                        latitude: currentLat,
                        longitude: currentLong,
                        altitude: 0,
                        accuracy: 10
                    }
                });
                return defer.promise;
            });

            var expectedState = {
                isActive: true,
                isLoading: false,
                isFollowing: true,
                isRotating: false
            };

            expect(GeolocationService.isActive()).toBe(false);
            GeolocationService.enable().then(function () {
                GeolocationService.switchState().then(function () {
                    GeolocationService.switchState().then(function () {
                        GeolocationService.switchState(expectedState).then(function (val) {
                            expect(val).toEqual(expectedState);
                            done();
                        }).catch(function (err) {
                            fail('it should resolve promise');
                        });
                    }).catch(function (err) {
                        fail('it should resolve promise');
                    });
                }).catch(function (err) {
                    fail('it should resolve promise');
                });
            });

            $httpBackend.flush();
        });

        it('goalState = isFollowing && isRotating, state === isActive && !isLoading && !isFollowing && !isRotating  => it should start rotating and following and resolve with current state', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                defer.resolve({
                    coords: {
                        latitude: currentLat,
                        longitude: currentLong,
                        altitude: 0,
                        accuracy: 10
                    }
                });
                return defer.promise;
            });
            spyOn($cordovaDeviceOrientation, 'watchHeading').and.callFake(function () {
                var defer = $q.defer();
                var obj = {};
                defer.resolve(
                    obj
                );
                defer.promise.watch = obj;
                defer.promise.clearWatch = function () {
                    delete defer.promise.watch
                };
                return defer.promise;
            });

            var expectedState = {
                isActive: true,
                isLoading: false,
                isFollowing: true,
                isRotating: true
            };

            expect(GeolocationService.isActive()).toBe(false);
            GeolocationService.enable().then(function () {
                GeolocationService.switchState().then(function () {
                    GeolocationService.switchState().then(function () {
                        GeolocationService.switchState(expectedState).then(function (val) {
                            expect(val).toEqual(expectedState);
                            done();
                        }).catch(function (err) {
                            fail('it should resolve promise');
                        });
                    }).catch(function (err) {
                        fail('it should resolve promise');
                    });
                }).catch(function (err) {
                    fail('it should resolve promise');
                });
            });

            $httpBackend.flush();
        });

        it('goalState = !isFollowing && !isRotating, state === isActive && !isLoading && !isFollowing && !isRotating  => it should stay on the same state and resolve with current state', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                defer.resolve({
                    coords: {
                        latitude: currentLat,
                        longitude: currentLong,
                        altitude: 0,
                        accuracy: 10
                    }
                });
                return defer.promise;
            });
            spyOn($cordovaDeviceOrientation, 'watchHeading').and.callFake(function () {
                var defer = $q.defer();
                var obj = {};
                defer.resolve(
                    obj
                );
                defer.promise.watch = obj;
                defer.promise.clearWatch = function () {
                    delete defer.promise.watch
                };
                return defer.promise;
            });

            var expectedState = {
                isActive: true,
                isLoading: false,
                isFollowing: false,
                isRotating: false
            };

            expect(GeolocationService.isActive()).toBe(false);
            GeolocationService.enable().then(function () {
                GeolocationService.switchState().then(function () {
                    GeolocationService.switchState().then(function () {
                        GeolocationService.switchState(expectedState).then(function (val) {
                            expect(val).toEqual(expectedState);
                            done();
                        }).catch(function (err) {
                            fail('it should resolve promise');
                        });
                    }).catch(function (err) {
                        fail('it should resolve promise');
                    });
                }).catch(function (err) {
                    fail('it should resolve promise');
                });
            });

            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe("startRecording", function () {
        it('no params defined => it should reject with an error', function (done) {
            GeolocationService.enable().then(function () {
                GeolocationService.startRecording().then(function (val) {
                    fail('it should reject promise');
                }).catch(function (err) {
                    expect(err).toEqual(ERRORS.MISSING_ARGUMENTS);
                    done();
                });
            }).catch(function (err) {
                expect(err).toEqual(ERRORS.MISSING_ARGUMENTS);
                done();
            });


            $httpBackend.flush();
        });

        it('!recordingState.isActive and navigationTrack defined => it should start recording emitting a recordingState-changed and resolving with current state', function (done) {
            var expectedValue = {
                isActive: true,
                isPaused: false
            };
            spyOn($rootScope, '$emit');
            GeolocationService.enable().then(function () {
                GeolocationService.startRecording({
                    parentId: 1,
                    id: 1
                }).then(function (val) {
                    expect(val).toEqual(expectedValue);
                    expect($rootScope.$emit).toHaveBeenCalledWith('recordingState-changed', expectedValue);
                    done();
                }).catch(function (err) {
                    fail("it should resolve promise" + err);
                });
            }).catch(function (err) {
                fail("it should resolve promise" + err);
            });

            $httpBackend.flush();
        });

        it('recordingState.isActive &&  params defined => it should not restart recording and reject promise with error code', function (done) {
            var expectedValue = {
                isActive: true,
                isPaused: false
            };
            var spy = spyOn($rootScope, '$emit');
            GeolocationService.enable().then(function () {
                GeolocationService.startRecording({
                    parentId: 1,
                    id: 1
                }).then(function (val) {
                    expect(val).toEqual(expectedValue);
                    expect($rootScope.$emit).toHaveBeenCalledWith('recordingState-changed', expectedValue);
                    spy.calls.reset();
                    GeolocationService.startRecording({
                        parentId: 1,
                        id: 1
                    }).then(function (val) {
                        fail('it should reject promise');
                    }).catch(function (err) {
                        expect($rootScope.$emit).not.toHaveBeenCalled();
                        expect(err).toEqual(ERRORS.ALREADY_ACTIVE);
                        done();
                    });
                })
            }).catch(function (err) {
                fail("it should resolve promise" + err);
            });

            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe("pauseRecording", function () {
        it("!recordingState.isActive => it should reject promise with error code and  not emit recordingState-changed", function (done) {
            var spyEmit = spyOn($rootScope, '$emit');
            GeolocationService.enable().then(function () {
                spyEmit.calls.reset();
                GeolocationService.pauseRecording().then(function (val) {
                    fail("it should reject promoise with error code");
                }).catch(function (err) {
                    expect($rootScope.$emit).not.toHaveBeenCalled();
                    expect(err).toEqual(ERRORS.DISABLED);
                    done();
                });
            }).catch(function (err) {
                fail("it should resolve promise" + err);
            });

            $httpBackend.flush();
        });

        it("recordingState.isActive && !recordingState.isPaused && params defined=> it should resolve promise with new state and emit recordingState-changed", function (done) {
            var expectedValue = {
                isActive: true,
                isPaused: true
            };
            spyOn($rootScope, '$emit');
            GeolocationService.enable().then(function () {
                GeolocationService.startRecording({
                    parentId: 1,
                    id: 1
                }).then(function (val) {
                    GeolocationService.pauseRecording().then(function (val) {
                        expect(val).toEqual(expectedValue);
                        expect($rootScope.$emit).toHaveBeenCalledWith('recordingState-changed', expectedValue);
                        done();
                    })
                }).catch(function (err) {
                    fail("it should resolve promise and start recording");
                })
            }).catch(function (err) {
                fail("it should resolve promise" + err);
            });

            $httpBackend.flush();
        });

        it("recordingState.isActive && recordingState.isPaused &&  params=> it should resolve promise with current state and not emit recordingState-changed", function (done) {
            var expectedValue = {
                isActive: true,
                isPaused: true
            };
            var spy = spyOn($rootScope, '$emit');
            GeolocationService.enable().then(function () {
                GeolocationService.startRecording({
                    parentId: 1,
                    id: 1
                }).then(function (val) {
                    GeolocationService.pauseRecording().then(function (val) {
                        spy.calls.reset();
                        GeolocationService.pauseRecording().then(function (val) {
                            expect($rootScope.$emit).not.toHaveBeenCalled();
                            expect(val).toEqual(expectedValue);
                            done();
                        }).catch(function (err) {
                            fail("it should resolve promise with current state");
                        });;
                    }).catch(function (err) {
                        fail("it should resolve promise and pause recording");
                    });
                }).catch(function (err) {
                    fail("it should resolve promise and start recording");
                });
            }).catch(function (err) {
                fail("it should resolve promise" + err);
            });

            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('resumeRecording', function () {
        it('!recordingState.isActive =>it should resolve promise with false and not emit recordingState-changed', function (done) {
            var spyEmit = spyOn($rootScope, '$emit');
            GeolocationService.enable().then(function () {
                spyEmit.calls.reset();
                GeolocationService.resumeRecording().then(function (val) {
                    fail("it should reject promise cause no recording is active");
                }).catch(function (err) {
                    expect(err).toBe(ERRORS.DISABLED);
                    expect($rootScope.$emit).not.toHaveBeenCalled();
                    done();
                });
            }).catch(function (err) {
                fail("it should resolve promise" + err);
            });

            $httpBackend.flush();
        });

        it('recordingState.isActive && !recordingState.isPaused=>it should resolve promise with current state and not emit recordingState-changed', function (done) {
            var expectedValue = {
                isActive: true,
                isPaused: false
            };
            var spy = spyOn($rootScope, '$emit');
            GeolocationService.enable().then(function () {
                GeolocationService.startRecording({
                    parentId: 1,
                    id: 1
                }).then(function (val) {
                    spy.calls.reset();
                    GeolocationService.resumeRecording().then(function (val) {
                        expect(val).toEqual(expectedValue);
                        expect($rootScope.$emit).not.toHaveBeenCalled();
                        done();
                    }).catch(function (err) {
                        fail("it should resolve promise with current state");
                    });;
                }).catch(function (err) {
                    fail("it should resolve promise and start recording");
                });
            }).catch(function (err) {
                fail("it should resolve promise" + err);
            });

            $httpBackend.flush();
        });

        it('recordingState.isActive && recordingState.isPaused=>it should resolve promise with new state and emit recordingState-changed', function (done) {
            var expectedValue = {
                isActive: true,
                isPaused: false
            };
            var spy = spyOn($rootScope, '$emit');
            GeolocationService.enable().then(function () {
                GeolocationService.startRecording({
                    parentId: 1,
                    id: 1
                }).then(function (val) {
                    spy.calls.reset();
                    GeolocationService.pauseRecording().then(function () {
                        spy.calls.reset();
                        GeolocationService.resumeRecording().then(function (val) {
                            expect(val).toEqual(expectedValue);
                            expect($rootScope.$emit).toHaveBeenCalledWith('recordingState-changed', expectedValue);
                            done();
                        }).catch(function (err) {
                            fail("it should resolve promise and resume recording");
                        });;
                    }).catch(function (err) {
                        fail("it should resolve promise and pause recording");
                    });;
                }).catch(function (err) {
                    fail("it should resolve promise and start recording");
                });
            }).catch(function (err) {
                fail("it should resolve promise" + err);
            });

            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('stopRecording', function () {
        it('!recordingState.isActive => it should resolve with state and emit recordingState-changed', function (done) {
            var expectedValue = {
                isActive: false,
                isPaused: false
            };
            spyOn($rootScope, '$emit');
            GeolocationService.enable().then(function () {
                GeolocationService.stopRecording({
                    parentId: 1,
                    id: 1
                }).then(function (val) {
                    expect(val).toEqual(expectedValue);
                    expect($rootScope.$emit).toHaveBeenCalled();
                    done();
                }).catch(function (err) {
                    fail("it should resolve promise and stop recording");
                });
            }).catch(function (err) {
                fail("it should resolve promise" + err);
            });

            $httpBackend.flush();
        });

        it('recordingState.isActive => it should resolve with true and emit recordingState-changed', function (done) {
            var expectedValue = {
                isActive: false,
                isPaused: false
            };
            var spy = spyOn($rootScope, '$emit');
            GeolocationService.enable().then(function () {
                GeolocationService.startRecording({
                    parentId: 1,
                    id: 1
                }).then(function (val) {
                    spy.calls.reset();
                    GeolocationService.stopRecording().then(function (val) {
                        expect(val).toEqual(expectedValue);
                        expect($rootScope.$emit).toHaveBeenCalledWith('recordingState-changed', expectedValue);
                        done();
                    }).catch(function (err) {
                        fail("it should resolve promise and stop recording");
                    });;
                }).catch(function (err) {
                    fail("it should resolve promise and start recording");
                });
            }).catch(function (err) {
                fail("it should resolve promise" + err);
            });
            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('getStats', function () {
        it('!recordingState.isActive => it should reject promise with false', function (done) {
            GeolocationService.getStats().then(function (val) {
                fail('it should reject promise');
            }).catch(function (err) {
                expect(err).toBe(false);
                done();
            });
            $httpBackend.flush();
        });

        it('recordingState.isActive => it should resolve promise with current stats', function (done) {
            spyOn($rootScope, '$emit');
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                defer.resolve({
                    coords: {
                        latitude: currentLat,
                        longitude: currentLong,
                        altitude: 0,
                        accuracy: 10
                    }
                });
                return defer.promise;
            });

            var timeToTick = 2000;
            GeolocationService.enable().then(function (val) {
                GeolocationService.startRecording({
                    parentId: 1,
                    id: 1
                }).then(function (val) {
                    var requestDate = new Date(Date.now() + timeToTick);
                    jasmine.clock().mockDate(requestDate);
                    var distanceExpected = Utils.distanceInMeters(currentLat, currentLong, currentLat + 0.001, currentLong);
                    BackgroundGeolocation.callbackFun['location']({
                        latitude: (currentLat + 0.001),
                        longitude: currentLong,
                        altitude: 0,
                        accuracy: 10
                    });

                    GeolocationService.getStats().then(function (val) {
                        console.log(val)
                        var timeValue = Math.floor(val.time / 1000);
                        var currentSpeedValue = Math.floor(val.currentSpeed);
                        var averageSpeedValue = Math.floor(val.averageSpeed);
                        expect(timeValue).toBe(timeToTick / 1000);
                        expect(val.distance).toEqual(distanceExpected);
                        var speed = Math.floor(distanceExpected / timeToTick * 3600);
                        // expect(currentSpeedValue).toEqual(0);
                        // expect(averageSpeedValue).toEqual(speed);
                        done();
                    }).catch(function (err) {
                        fail('it should resolve promise and return stats');
                    });
                }).catch(function (err) {
                    fail('it should resolve promise and start recording');
                });;

            }).catch(function (err) {
                fail('it should resolve promise and enable gps');
            });;
            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe("handleToast", function () {
        var outOfTrackToastDelay = 10000;
        var spyShowToast;
        var spyHideToast;
        var spyMakeSound;

        beforeEach(function () {
            jasmine.clock().install();
        });
        afterEach(function () {
            jasmine.clock().uninstall();
        });

        beforeEach(function () {
            spyOn($rootScope, '$emit');
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                defer.resolve({
                    coords: {
                        latitude: currentLat,
                        longitude: currentLong,
                        altitude: 0,
                        accuracy: 10
                    }
                });
                return defer.promise;
            });
            spyOn(MapService, 'getFeatureById').and.callFake(function () {
                var defer = $q.defer();
                var feature = {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [currentLong, currentLat],
                            [currentLong, currentLat + 0.0002],
                            [currentLong, currentLat + 0.0003],
                            [currentLong, currentLat + 0.0004],
                            [currentLong + 0.0001, currentLat + 0.0004],
                        ]
                    }
                };
                defer.resolve(feature);
                return defer.promise;
            });
            spyShowToast = spyOn(Utils, 'showToast').and.callFake(function () { });
            spyHideToast = spyOn(Utils, 'hideToast').and.callFake(function () { });
            spyMakeSound = spyOn(Utils, 'makeNotificationSound').and.callFake(function () { });
        });

        it("'Never gone outside track => it should not show toast", function (done) {
            spyOn(window.turf.pointToLineDistance, 'default').and.callThrough();
            GeolocationService.enable().then(function (val) {
                GeolocationService.startRecording({
                    parentId: 1,
                    id: 1
                }).then(function () {
                    callPositionCallback((currentLat - 0.001), currentLong);
                    jasmine.clock().tick(outOfTrackToastDelay + 1);

                    callPositionCallback((currentLat + 0.001), currentLong);
                    jasmine.clock().tick(outOfTrackToastDelay + 1);

                    callPositionCallback((currentLat + 0.0003), currentLong);
                    jasmine.clock().tick(outOfTrackToastDelay + 1);

                    expect(Utils.showToast).not.toHaveBeenCalled();
                    expect(Utils.makeNotificationSound).not.toHaveBeenCalled();

                    done();
                }).catch(function (err) {
                    done.fail("it should resolve promise and start recording")
                })
            }).catch(function (err) {
                done.fail("it should resolve promise and enable gps")
            })
            $httpBackend.flush();
        });

        it("out of track for (outOfTrackToastDelay + 1) ms => it should show toast", function (done) {
            spyOn(window.turf.pointToLineDistance, 'default').and.callThrough();
            GeolocationService.enable().then(function (val) {
                GeolocationService.startRecording({
                    parentId: 1,
                    id: 1
                }).then(function () {
                    expect(Utils.showToast).not.toHaveBeenCalled();
                    callPositionCallback((currentLat - 0.002), currentLong);
                    jasmine.clock().tick(outOfTrackToastDelay + 1);
                    expect(Utils.showToast).toHaveBeenCalled();
                    expect(Utils.makeNotificationSound).toHaveBeenCalled();
                    done();
                }).catch(function (err) {
                    fail("it should resolve promise and start recording")
                })
            }).catch(function (err) {
                fail("it should resolve promise and enable gps")
            })
            $httpBackend.flush();
        });

        it("Back out from re-entering track in (outOfTrackToastDelay - 1) ms => it should not hide the open toast", function (done) {
            spyOn(window.turf.pointToLineDistance, 'default').and.callThrough();
            GeolocationService.enable().then(function (val) {
                GeolocationService.startRecording({
                    parentId: 1,
                    id: 1
                }).then(function () {
                    callPositionCallback(currentLat - 0.002, currentLong);
                    jasmine.clock().tick(outOfTrackToastDelay + 1);
                    expect(Utils.showToast).toHaveBeenCalled();
                    expect(Utils.makeNotificationSound).toHaveBeenCalled();

                    callPositionCallback(currentLat - 0.001, currentLong);
                    spyHideToast.calls.reset();
                    jasmine.clock().tick((outOfTrackToastDelay - 1) / 2);
                    expect(Utils.hideToast).not.toHaveBeenCalled();

                    callPositionCallback(currentLat - 0.002, currentLong);
                    spyHideToast.calls.reset();
                    jasmine.clock().tick((outOfTrackToastDelay - 1) / 2);
                    expect(Utils.hideToast).not.toHaveBeenCalled();

                    done();
                }).catch(function (err) {
                    fail("it should resolve promise and start recording")
                });
            }).catch(function (err) {
                fail("it should resolve promise and enable gps")
            })
            $httpBackend.flush();
        });

        it("Back in from outside track for (outOfTrackToastDelay + 1) ms => it should hide the open) toast ", function (done) {
            spyOn(window.turf.pointToLineDistance, 'default').and.callThrough();
            GeolocationService.enable().then(function (val) {
                GeolocationService.startRecording({
                    parentId: 1,
                    id: 1
                }).then(function () {
                    callPositionCallback(currentLat - 0.002, currentLong);
                    jasmine.clock().tick(outOfTrackToastDelay + 1);
                    expect(Utils.showToast).toHaveBeenCalled();
                    expect(Utils.makeNotificationSound).toHaveBeenCalled();

                    callPositionCallback(currentLat - 0.001, currentLong);
                    spyHideToast.calls.reset();
                    jasmine.clock().tick(outOfTrackToastDelay + 1);
                    expect(Utils.hideToast).toHaveBeenCalled();

                    done();
                }).catch(function (err) {
                    fail("it should resolve promise and start recording")
                })
            }).catch(function (err) {
                fail("it should resolve promise and enable gps")
            })
            $httpBackend.flush();
        });

        it("Back in from outside track for (outOfTrackToastDelay - 1) ms => it should continue to show toast", function (done) {
            spyOn(window.turf.pointToLineDistance, 'default').and.callThrough();
            GeolocationService.enable().then(function (val) {
                GeolocationService.startRecording({
                    parentId: 1,
                    id: 1
                }).then(function () {
                    callPositionCallback(currentLat - 0.002, currentLong);
                    jasmine.clock().tick(outOfTrackToastDelay + 1);
                    expect(Utils.showToast).toHaveBeenCalled();
                    expect(Utils.makeNotificationSound).toHaveBeenCalled();

                    spyShowToast.calls.reset();
                    callPositionCallback(currentLat - 0.001, currentLong);
                    spyHideToast.calls.reset();
                    jasmine.clock().tick(outOfTrackToastDelay - 1);
                    expect(Utils.showToast).toHaveBeenCalled();
                    expect(Utils.hideToast).not.toHaveBeenCalled();

                    done();
                }).catch(function (err) {
                    fail("it should resolve promise and start recording")
                })
            }).catch(function (err) {
                fail("it should resolve promise and enable gps")
            })
            $httpBackend.flush();
        });

        it("Back out from inside of track before (outOfTrackToastDelay) ms => it should not show toast", function (done) {
            spyOn(window.turf.pointToLineDistance, 'default').and.callThrough();
            GeolocationService.enable().then(function (val) {
                GeolocationService.startRecording({
                    parentId: 1,
                    id: 1
                }).then(function () {
                    callPositionCallback(currentLat - 0.002, currentLong);
                    jasmine.clock().tick(outOfTrackToastDelay - 1);
                    expect(Utils.showToast).not.toHaveBeenCalled();
                    expect(Utils.makeNotificationSound).not.toHaveBeenCalled();
                    done();
                }).catch(function (err) {
                    fail("it should resolve promise and start recording")
                })
            }).catch(function (err) {
                fail("it should resolve promise and enable gps")
            })
            $httpBackend.flush();
        });

        it("Back in from outside track before (outOfTrackToastDelay) ms  => it should not show toast", function (done) {
            spyOn(window.turf.pointToLineDistance, 'default').and.callThrough();
            GeolocationService.enable().then(function (val) {
                GeolocationService.startRecording({
                    parentId: 1,
                    id: 1
                }).then(function () {
                    callPositionCallback(currentLat - 0.002, currentLong);
                    jasmine.clock().tick(outOfTrackToastDelay / 2);
                    expect(Utils.showToast).not.toHaveBeenCalled();
                    expect(Utils.makeNotificationSound).not.toHaveBeenCalled();

                    spyShowToast.calls.reset();
                    spyMakeSound.calls.reset();
                    callPositionCallback(currentLat - 0.001, currentLong);
                    spyHideToast.calls.reset();
                    jasmine.clock().tick(outOfTrackToastDelay / 2 - 1);
                    expect(Utils.showToast).not.toHaveBeenCalled();
                    expect(Utils.hideToast).not.toHaveBeenCalled();

                    done();
                }).catch(function (err) {
                    fail("it should resolve promise and start recording")
                })
            }).catch(function (err) {
                fail("it should resolve promise and enable gps")
            })
            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('recordingUserTrack', function () {
        it('!recordingState.isActive && recordTrack && !firstPositionIsSet => it should start recording emitting a recordingState-changed, creating a new user polyline and resolving with current state', function (done) {
            var expectedValue = {
                isActive: true,
                isPaused: false
            };
            spyOn($rootScope, '$emit');
            GeolocationService.enable().then(function () {
                GeolocationService.startRecording(null, true).then(function (val) {
                    expect(val).toEqual(expectedValue);
                    expect($rootScope.$emit).toHaveBeenCalledWith('recordingState-changed', expectedValue);
                    expect(MapService.createUserPolyline).toHaveBeenCalledWith([]);
                    done();
                }).catch(function (err) {
                    fail("it should resolve promise" + err);
                });
            }).catch(function (err) {
                fail("it should resolve promise" + err);
            });

            $httpBackend.flush();
        })

        it('!recordingState.isActive && recordTrack defined && firstPositionIsSet=> it should start recording emitting a recordingState-changed, creating a new user polyline and resolving with current state', function (done) {
            var expectedValue = {
                isActive: true,
                isPaused: false
            };
            spyOn($rootScope, '$emit');
            GeolocationService.enable().then(function () {
                BackgroundGeolocation.callbackFun['location']({
                    latitude: currentLat,
                    longitude: currentLong,
                    altitude: 0,
                    accuracy: 10
                });
                GeolocationService.startRecording(null, true).then(function (val) {
                    expect(val).toEqual(expectedValue);
                    expect($rootScope.$emit).toHaveBeenCalledWith('recordingState-changed', expectedValue);
                    expect(MapService.createUserPolyline).toHaveBeenCalledWith([
                        [currentLat, currentLong, 0]
                    ]);
                    done();
                }).catch(function (err) {
                    fail("it should resolve promise" + err);
                });
            }).catch(function (err) {
                fail("it should resolve promise" + err);
            });

            $httpBackend.flush();
        })

        it('recordingState.isActive && new position is send=> it should update polyline with new position', function (done) {
            var expectedValue = {
                isActive: true,
                isPaused: false
            };
            spyOn($rootScope, '$emit');
            GeolocationService.enable().then(function () {
                GeolocationService.startRecording(null, true).then(function (val) {
                    expect(val).toEqual(expectedValue);
                    expect($rootScope.$emit).toHaveBeenCalledWith('recordingState-changed', expectedValue);
                    expect(MapService.createUserPolyline).toHaveBeenCalledWith([]);
                    BackgroundGeolocation.callbackFun['location']({
                        latitude: currentLat,
                        longitude: currentLong,
                        altitude: 0,
                        accuracy: 10
                    });
                    expect(MapService.updateUserPolyline).toHaveBeenCalledWith([currentLat, currentLong, 0]);
                    done();
                }).catch(function (err) {
                    fail("it should resolve promise" + err);
                });
            }).catch(function (err) {
                fail("it should resolve promise" + err);
            });

            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('GPSSettingsSwitched', function () {
        var enableSpy, disableSpy, recordingStateChangedSpy;
        beforeEach(function () {
            enableSpy = spyOn(GeolocationService, 'enable').and.callThrough();
            disableSpy = spyOn(GeolocationService, 'disable').and.callThrough();
            recordingStateChangedSpy = spyOn($rootScope, '$emit').and.callThrough();
        });

        describe('platform android', function () {
            beforeEach(function () {
                window.platformId = 'android';
            });

            it('turned on => geolocation should be enabled', function () {
                enableSpy.calls.reset();
                disableSpy.calls.reset();
                recordingStateChangedSpy.calls.reset();
                window.cordova.plugins.diagnostic.gpsStateChangeCallback(window.cordova.plugins.diagnostic.locationMode.LOCATION_ON);
                expect(enableSpy).toHaveBeenCalledTimes(1);
                expect(disableSpy).not.toHaveBeenCalled();
                expect(recordingStateChangedSpy).not.toHaveBeenCalledWith('recordingState-changed', {
                    isActive: false,
                    isPaused: false
                });

                $httpBackend.flush();
            });

            it('not recording, turned off => geolocation should be enabled', function (done) {
                GeolocationService.enable().then(function (value) {
                    enableSpy.calls.reset();
                    disableSpy.calls.reset();
                    recordingStateChangedSpy.calls.reset();
                    window.cordova.plugins.diagnostic.gpsStateChangeCallback(window.cordova.plugins.diagnostic.locationMode.LOCATION_OFF)
                    expect(enableSpy).not.toHaveBeenCalled();
                    expect(disableSpy).toHaveBeenCalledTimes(1);
                    expect(recordingStateChangedSpy).not.toHaveBeenCalledWith('recordingState-changed', {
                        isActive: false,
                        isPaused: false
                    });
                    done();
                }).catch(function () {
                    fail('it should resolve first');
                });

                $httpBackend.flush();
            });

            it('not recording, turned off => geolocation should be enabled', function (done) {
                GeolocationService.enable().then(function (value) {
                    enableSpy.calls.reset();
                    disableSpy.calls.reset();
                    recordingStateChangedSpy.calls.reset();
                    GeolocationService.startRecording(null, true).then(function () {
                        window.cordova.plugins.diagnostic.gpsStateChangeCallback(window.cordova.plugins.diagnostic.locationMode.LOCATION_OFF)
                        expect(enableSpy).not.toHaveBeenCalled();
                        expect(disableSpy).toHaveBeenCalledTimes(1);
                        expect(recordingStateChangedSpy).toHaveBeenCalledWith('recordingState-changed', {
                            isActive: false,
                            isPaused: false
                        });
                        done();
                    });
                }).catch(function () {
                    fail('it should resolve first');
                });

                $httpBackend.flush();
            });

            afterEach(function () {
                $httpBackend.verifyNoOutstandingExpectation();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });

        describe('platform ios', function () {
            beforeEach(function () {
                window.platformId = 'ios';
            });

            it('turned on with permission granted => geolocation should be enabled', function () {
                enableSpy.calls.reset();
                disableSpy.calls.reset();
                recordingStateChangedSpy.calls.reset();
                window.cordova.plugins.diagnostic.gpsStateChangeCallback(window.cordova.plugins.diagnostic.permissionStatus.GRANTED);
                expect(enableSpy).toHaveBeenCalledTimes(1);
                expect(disableSpy).not.toHaveBeenCalled();
                expect(recordingStateChangedSpy).not.toHaveBeenCalledWith('recordingState-changed', {
                    isActive: false,
                    isPaused: false
                });

                $httpBackend.flush();
            });

            it('turned on with permissions granted when in use => geolocation should be enabled', function () {
                enableSpy.calls.reset();
                disableSpy.calls.reset();
                recordingStateChangedSpy.calls.reset();
                window.cordova.plugins.diagnostic.gpsStateChangeCallback(window.cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE);
                expect(enableSpy).toHaveBeenCalledTimes(1);
                expect(disableSpy).not.toHaveBeenCalled();
                expect(recordingStateChangedSpy).not.toHaveBeenCalledWith('recordingState-changed', {
                    isActive: false,
                    isPaused: false
                });

                $httpBackend.flush();
            });

            it('not recording, turned off => geolocation should be enabled', function (done) {
                GeolocationService.enable().then(function (value) {
                    enableSpy.calls.reset();
                    disableSpy.calls.reset();
                    recordingStateChangedSpy.calls.reset();
                    window.cordova.plugins.diagnostic.gpsStateChangeCallback(window.cordova.plugins.diagnostic.locationMode.LOCATION_OFF)
                    expect(enableSpy).not.toHaveBeenCalled();
                    expect(disableSpy).toHaveBeenCalledTimes(1);
                    expect(recordingStateChangedSpy).not.toHaveBeenCalledWith('recordingState-changed', {
                        isActive: false,
                        isPaused: false
                    });
                    done();
                }).catch(function () {
                    fail('it should resolve first');
                });

                $httpBackend.flush();
            });

            it('not recording, turned off => geolocation should be enabled', function (done) {
                GeolocationService.enable().then(function (value) {
                    enableSpy.calls.reset();
                    disableSpy.calls.reset();
                    recordingStateChangedSpy.calls.reset();
                    GeolocationService.startRecording(null, true).then(function () {
                        window.cordova.plugins.diagnostic.gpsStateChangeCallback(window.cordova.plugins.diagnostic.locationMode.LOCATION_OFF)
                        expect(enableSpy).not.toHaveBeenCalled();
                        expect(disableSpy).toHaveBeenCalledTimes(1);
                        expect(recordingStateChangedSpy).toHaveBeenCalledWith('recordingState-changed', {
                            isActive: false,
                            isPaused: false
                        });
                        done();
                    });
                }).catch(function () {
                    fail('it should resolve first');
                });

                $httpBackend.flush();
            });

            afterEach(function () {
                $httpBackend.verifyNoOutstandingExpectation();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });
    });

    describe('at map', function () {
        var togglePositionIconSpy, animateBearingSpy, stateChangedSpy;

        beforeEach(function () {
            togglePositionIconSpy = spyOn(MapService, 'togglePositionIcon');
            animateBearingSpy = spyOn(MapService, 'animateBearing');
            stateChangedSpy = spyOn($rootScope, '$emit').and.callThrough();
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                defer.resolve({
                    coords: {
                        latitude: currentLat,
                        longitude: currentLong,
                        altitude: 0,
                        accuracy: 10
                    }
                });
                return defer.promise;
            });
            spyOn($cordovaDeviceOrientation, 'watchHeading').and.callFake(function () {
                var defer = $q.defer();
                var obj = {};
                defer.resolve(
                    obj
                );
                defer.promise.watch = obj;
                defer.promise.clearWatch = function () {
                    delete defer.promise.watch
                };
                return defer.promise;
            });
        });

        describe('drag start', function () {
            it('if only following should stop following', function (done) {
                var expectedStartingState = {
                    isActive: true,
                    isFollowing: true,
                    isRotating: false,
                    isLoading: false
                };
                GeolocationService.enable().then(function (value) {
                    expect(value).toEqual(expectedStartingState);

                    togglePositionIconSpy.calls.reset();
                    spy['mapIsRotating'].calls.reset();
                    animateBearingSpy.calls.reset();
                    stateChangedSpy.calls.reset();

                    $rootScope.$emit('map-dragstart');

                    expect(togglePositionIconSpy).toHaveBeenCalledWith('locationIcon');
                    expect(spy['mapIsRotating']).toHaveBeenCalledWith(false);
                    expect(animateBearingSpy).toHaveBeenCalledWith(0, 800);
                    expect(stateChangedSpy).toHaveBeenCalledWith('geolocationState-changed', {
                        isActive: true,
                        isLoading: false,
                        isFollowing: false,
                        isRotating: false
                    });
                    done();
                }).catch(function () {
                    done.fail("it should not trigger any exception");
                });

                $httpBackend.flush();
            });

            it('if following and rotating should stop both', function (done) {
                var expectedStartingState = {
                    isActive: true,
                    isFollowing: true,
                    isRotating: true,
                    isLoading: false
                };

                GeolocationService.enable().then(function (value) {
                    GeolocationService.switchState().then(function (state) {
                        expect(state).toEqual(expectedStartingState);

                        togglePositionIconSpy.calls.reset();
                        spy['mapIsRotating'].calls.reset();
                        animateBearingSpy.calls.reset();
                        stateChangedSpy.calls.reset();

                        $rootScope.$emit('map-dragstart');

                        expect(togglePositionIconSpy).toHaveBeenCalledWith('locationIcon');
                        expect(spy['mapIsRotating']).toHaveBeenCalledWith(false);
                        expect(animateBearingSpy).toHaveBeenCalledWith(0, 800);
                        expect(stateChangedSpy).toHaveBeenCalledWith('geolocationState-changed', {
                            isActive: true,
                            isLoading: false,
                            isFollowing: false,
                            isRotating: false
                        });
                        done();
                    });
                }).catch(function () {
                    done.fail("it should not trigger any exception");
                });

                $httpBackend.flush();
            });
        });

        describe('zoom start without custom programmatically triggered events', function () {
            it('if only following should stop following', function (done) {
                var expectedStartingState = {
                    isActive: true,
                    isFollowing: true,
                    isRotating: false,
                    isLoading: false
                };
                GeolocationService.enable().then(function (value) {
                    expect(value).toEqual(expectedStartingState);

                    togglePositionIconSpy.calls.reset();
                    spy['mapIsRotating'].calls.reset();
                    animateBearingSpy.calls.reset();
                    stateChangedSpy.calls.reset();

                    $rootScope.$emit('map-zoomstart');
                    $rootScope.$emit('map-zoomstart');

                    expect(togglePositionIconSpy).toHaveBeenCalledWith('locationIcon');
                    expect(spy['mapIsRotating']).toHaveBeenCalledWith(false);
                    expect(animateBearingSpy).toHaveBeenCalledWith(0, 800);
                    expect(stateChangedSpy).toHaveBeenCalledWith('geolocationState-changed', {
                        isActive: true,
                        isLoading: false,
                        isFollowing: false,
                        isRotating: false
                    });
                    done();
                }).catch(function () {
                    done.fail("it should not trigger any exception");
                });

                $httpBackend.flush();
            });

            it('if following and rotating should stop both', function () {
                var expectedStartingState = {
                    isActive: true,
                    isFollowing: true,
                    isRotating: true,
                    isLoading: false
                };

                GeolocationService.enable().then(function (value) {
                    GeolocationService.switchState().then(function (state) {
                        expect(state).toEqual(expectedStartingState);

                        togglePositionIconSpy.calls.reset();
                        spy['mapIsRotating'].calls.reset();
                        animateBearingSpy.calls.reset();
                        stateChangedSpy.calls.reset();

                        $rootScope.$emit('map-zoomstart');
                        $rootScope.$emit('map-zoomstart');

                        expect(togglePositionIconSpy).toHaveBeenCalledWith('locationIcon');
                        expect(spy['mapIsRotating']).toHaveBeenCalledWith(false);
                        expect(animateBearingSpy).toHaveBeenCalledWith(0, 800);
                        expect(stateChangedSpy).toHaveBeenCalledWith('geolocationState-changed', {
                            isActive: true,
                            isLoading: false,
                            isFollowing: false,
                            isRotating: false
                        });
                    });
                }).catch(function () {
                    fail("it should not trigger any exception");
                });

                $httpBackend.flush();
            });
        });

        describe('zoom start with custom programmatically triggered events', function () {
            it('if only following should stop following', function (done) {
                var expectedStartingState = {
                    isActive: true,
                    isFollowing: true,
                    isRotating: false,
                    isLoading: false
                };
                GeolocationService.enable().then(function (value) {
                    expect(value).toEqual(expectedStartingState);

                    togglePositionIconSpy.calls.reset();
                    spy['mapIsRotating'].calls.reset();
                    animateBearingSpy.calls.reset();
                    stateChangedSpy.calls.reset();

                    $rootScope.$emit('map-zoomstart');

                    expect(togglePositionIconSpy).not.toHaveBeenCalledWith('locationIcon');
                    expect(spy['mapIsRotating']).not.toHaveBeenCalledWith(false);
                    expect(animateBearingSpy).not.toHaveBeenCalledWith(0, 800);
                    expect(stateChangedSpy).not.toHaveBeenCalledWith('geolocationState-changed', {
                        isActive: true,
                        isLoading: false,
                        isFollowing: false,
                        isRotating: false
                    });
                    done();
                }).catch(function () {
                    done.fail("it should not trigger any exception");
                });

                $httpBackend.flush();
            });

            it('if following and rotating should stop both', function (done) {
                var expectedStartingState = {
                    isActive: true,
                    isFollowing: true,
                    isRotating: true,
                    isLoading: false
                };

                GeolocationService.enable().then(function (value) {
                    GeolocationService.switchState().then(function (state) {
                        expect(state).toEqual(expectedStartingState);

                        togglePositionIconSpy.calls.reset();
                        spy['mapIsRotating'].calls.reset();
                        animateBearingSpy.calls.reset();
                        stateChangedSpy.calls.reset();

                        $rootScope.$emit('map-zoomstart');

                        expect(togglePositionIconSpy).not.toHaveBeenCalledWith('locationIcon');
                        expect(spy['mapIsRotating']).not.toHaveBeenCalledWith(false);
                        expect(animateBearingSpy).not.toHaveBeenCalledWith(0, 800);
                        expect(stateChangedSpy).not.toHaveBeenCalledWith('geolocationState-changed', {
                            isActive: true,
                            isLoading: false,
                            isFollowing: false,
                            isRotating: false
                        });
                        done();
                    });
                }).catch(function () {
                    done.fail("it should not trigger any exception");
                });

                $httpBackend.flush();
            });
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('positionCallback', function () {
        beforeEach(function () {
            spyOn($cordovaDeviceOrientation, 'watchHeading').and.callFake(function () {
                var defer = $q.defer();
                var obj = {};
                defer.resolve(
                    obj
                );
                defer.promise.watch = obj;
                defer.promise.clearWatch = function () {
                    delete defer.promise.watch
                };
                return defer.promise;
            });
        });

        it('should not update position if geolocation has been disabled', function (done) {
            GeolocationService.enable().then(function () {
                callPositionCallback(currentLat, currentLong);
                expect(spy['hasMap']).toHaveBeenCalled();
                spy['hasMap'].calls.reset();

                GeolocationService.disable();

                spy['hasMap'].calls.reset();

                callPositionCallback(currentLat, currentLong);

                expect(spy['hasMap']).not.toHaveBeenCalled();
                done();
            }).catch(function () {
                done.fail('it should resolve the enable');
            });

            $httpBackend.flush();
        });

        it('should not update position after position found outside bounding box', function (done) {
            var disableSpy = spyOn(GeolocationService, 'disable').and.callThrough();
            spyOn(MapService, 'isInBoundingBox').and.callFake(function () {
                return false;
            });

            GeolocationService.enable().then(function () {
                expect(disableSpy).not.toHaveBeenCalled();
                callPositionCallback(90, 90);
                expect(disableSpy).toHaveBeenCalledTimes(1);
                done();
            }).catch(function () {
                done.fail('it should resolve the enable');
            });

            $httpBackend.flush();
        });

        it('should disable geolocation and recording if outside bounding box', function (done) {
            var disableSpy = spyOn(GeolocationService, 'disable').and.callThrough();
            var stopRecordingSpy = spyOn(GeolocationService, 'stopRecording').and.callThrough();
            spyOn(MapService, 'isInBoundingBox').and.callFake(function () {
                return false;
            });

            GeolocationService.enable().then(function () {
                GeolocationService.startRecording({
                    parentId: 1,
                    id: 1
                }).then(function () {
                    expect(disableSpy).not.toHaveBeenCalled();
                    expect(stopRecordingSpy).not.toHaveBeenCalled();
                    callPositionCallback(90, 90);
                    expect(disableSpy).toHaveBeenCalledTimes(1);
                    expect(stopRecordingSpy).toHaveBeenCalledTimes(1);

                    done();
                });
            }).catch(function () {
                done.fail('it should resolve the enable');
            });

            $httpBackend.flush();
        });

        describe('rotation type switch', function () {
            var toggleSpy;

            beforeEach(function () {
                jasmine.clock().install();

                toggleSpy = spyOn(MapService, 'togglePositionIcon').and.callThrough();
                spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                    var defer = $q.defer();
                    defer.resolve({
                        coords: {
                            latitude: currentLat,
                            longitude: currentLong,
                            altitude: 0,
                            accuracy: 10,
                            bearing: 10
                        }
                    });
                    return defer.promise;
                });
            });

            afterEach(function () {
                jasmine.clock().uninstall();
            });

            it('should use cordova-device-orientation for low speed', function (done) {
                GeolocationService.enable().then(function () {
                    GeolocationService.switchState().then(function (state) {
                        expect(state).toEqual({
                            isActive: true,
                            isLoading: false,
                            isFollowing: true,
                            isRotating: true
                        });

                        callPositionCallback(currentLat, currentLong, 10, 0);
                        expect(toggleSpy).not.toHaveBeenCalled();

                        callPositionCallback(currentLat - 0.001, currentLong, 10, 0);
                        expect(toggleSpy).not.toHaveBeenCalled();

                        callPositionCallback(currentLat - 0.001, currentLong, 10, 0);
                        expect(toggleSpy).not.toHaveBeenCalled();
                        done();
                    });
                }).catch(function () {
                    done.fail("An error has occurred");
                });

                $httpBackend.flush();
            });

            it('should not change from cordova-device-orientation for just one position at high speed', function (done) {
                GeolocationService.enable().then(function () {
                    GeolocationService.switchState().then(function (state) {
                        expect(state).toEqual({
                            isActive: true,
                            isLoading: false,
                            isFollowing: true,
                            isRotating: true
                        });

                        callPositionCallback(currentLat, currentLong, 10, 0);
                        expect(toggleSpy).not.toHaveBeenCalled();

                        callPositionCallback(currentLat - 0.001, currentLong, 10, 10);
                        expect(toggleSpy).not.toHaveBeenCalled();

                        callPositionCallback(currentLat - 0.001, currentLong, 10, 0);
                        expect(toggleSpy).not.toHaveBeenCalled();

                        callPositionCallback(currentLat - 0.001, currentLong, 10, 0);
                        expect(toggleSpy).not.toHaveBeenCalled();
                        done();
                    });
                }).catch(function () {
                    done.fail("An error has occurred");
                });

                $httpBackend.flush();
            });

            it('should change from cordova-device-orientation to gps speed after two positions at high speed', function (done) {
                GeolocationService.enable().then(function () {
                    GeolocationService.switchState().then(function (state) {
                        expect(state).toEqual({
                            isActive: true,
                            isLoading: false,
                            isFollowing: true,
                            isRotating: true
                        });

                        callPositionCallback(currentLat - 0.001, currentLong, 10, 10);
                        expect(toggleSpy).not.toHaveBeenCalled();

                        callPositionCallback(currentLat - 0.001, currentLong, 10, 10);
                        expect(toggleSpy).toHaveBeenCalledWith('locationIconArrow');
                        done();
                    });
                }).catch(function () {
                    done.fail("An error has occurred");
                });

                $httpBackend.flush();
            });

            it('should change from gps orientation back to cordova-device-orientation after constants.compassRotationTimeout ms of inactivity', function (done) {
                var start = Date.now();
                jasmine.clock().mockDate(start);

                GeolocationService.enable().then(function () {
                    GeolocationService.switchState().then(function (state) {
                        expect(state).toEqual({
                            isActive: true,
                            isLoading: false,
                            isFollowing: true,
                            isRotating: true
                        });

                        callPositionCallback(currentLat, currentLong, 10, 0);
                        callPositionCallback(currentLat, currentLong, 10, 10);
                        expect(toggleSpy).not.toHaveBeenCalled();

                        callPositionCallback(currentLat, currentLong, 10, 10);
                        expect(toggleSpy).toHaveBeenCalledWith('locationIconArrow');
                        toggleSpy.calls.reset();

                        jasmine.clock().tick(constants.compassRotationTimeout);
                        expect(toggleSpy).toHaveBeenCalledWith('locationIcon');
                        done();
                    });
                }).catch(function () {
                    done.fail("An error has occurred");
                });

                $httpBackend.flush();
            });

            it('should change from gps orientation back to cordova-device-orientation after constants.compassRotationTimeout ms of slow gps speed', function (done) {
                var start = Date.now();
                jasmine.clock().mockDate(start);

                GeolocationService.enable().then(function () {
                    GeolocationService.switchState().then(function (state) {
                        expect(state).toEqual({
                            isActive: true,
                            isLoading: false,
                            isFollowing: true,
                            isRotating: true
                        });

                        callPositionCallback(currentLat, currentLong, 10, 0);
                        callPositionCallback(currentLat, currentLong, 10, 10);
                        expect(toggleSpy).not.toHaveBeenCalled();

                        callPositionCallback(currentLat, currentLong, 10, 10);
                        expect(toggleSpy).toHaveBeenCalledWith('locationIconArrow');
                        toggleSpy.calls.reset();

                        callPositionCallback(currentLat, currentLong, 10, 0);
                        expect(toggleSpy).not.toHaveBeenCalled();

                        jasmine.clock().tick(constants.compassRotationTimeout + 1);

                        expect(toggleSpy).toHaveBeenCalledWith('locationIcon');
                        toggleSpy.calls.reset();
                        callPositionCallback(currentLat, currentLong, 10, 10);
                        expect(toggleSpy).not.toHaveBeenCalled();

                        done();
                    });
                }).catch(function () {
                    done.fail("An error has occurred");
                });

                $httpBackend.flush();
            });

            it('should not change from gps orientation back to cordova-device-orientation after less than constants.compassRotationTimeout ms of slow gps speed', function (done) {
                var start = Date.now();
                jasmine.clock().mockDate(start);

                GeolocationService.enable().then(function () {
                    GeolocationService.switchState().then(function (state) {
                        expect(state).toEqual({
                            isActive: true,
                            isLoading: false,
                            isFollowing: true,
                            isRotating: true
                        });

                        callPositionCallback(currentLat, currentLong, 10, 0);
                        callPositionCallback(currentLat, currentLong, 10, 10);
                        expect(toggleSpy).not.toHaveBeenCalled();

                        callPositionCallback(currentLat, currentLong, 10, 10);
                        expect(toggleSpy).toHaveBeenCalledWith('locationIconArrow');
                        toggleSpy.calls.reset();

                        callPositionCallback(currentLat, currentLong, 10, 0);
                        expect(toggleSpy).not.toHaveBeenCalled();

                        jasmine.clock().tick(constants.compassRotationTimeout - 1);

                        expect(toggleSpy).not.toHaveBeenCalled();
                        callPositionCallback(currentLat, currentLong, 10, 10);
                        expect(toggleSpy).toHaveBeenCalledWith('locationIconArrow');

                        done();
                    });
                }).catch(function () {
                    done.fail("An error has occurred");
                });

                $httpBackend.flush();
            });
        });
    });

    describe('backgroundGeolocation handlers', function () {
        var bgStartSpy,
            bgStopSpy,
            geolocationEnableSpy,
            geolocationDisableSpy,
            geolocationStopRecordingSpy;

        beforeEach(function () {
            bgStartSpy = spyOn(BackgroundGeolocation, 'start');
            bgStopSpy = spyOn(BackgroundGeolocation, 'stop');
            geolocationEnableSpy = spyOn(GeolocationService, 'enable').and.callThrough();
            geolocationDisableSpy = spyOn(GeolocationService, 'disable').and.callThrough();
            geolocationStopRecordingSpy = spyOn(GeolocationService, 'stopRecording');
        });

        it('should register all the handlers', function (done) {
            GeolocationService.enable().then(function () {
                expect(BackgroundGeolocation.callbackFun['location']).toEqual(jasmine.any(Function));
                expect(BackgroundGeolocation.callbackFun['stationary']).toEqual(jasmine.any(Function));
                expect(BackgroundGeolocation.callbackFun['error']).toEqual(jasmine.any(Function));
                expect(BackgroundGeolocation.callbackFun['background']).toEqual(jasmine.any(Function));
                expect(BackgroundGeolocation.callbackFun['foreground']).toEqual(jasmine.any(Function));
                done();
            }).catch(function () {
                done.fail();
            });

            $httpBackend.flush();
        });

        it('should unregister all the handlers', function (done) {
            var removeSpy = spyOn(BackgroundGeolocation, 'removeAllListeners');
            GeolocationService.enable().then(function () {
                GeolocationService.disable();

                expect(removeSpy).toHaveBeenCalledTimes(5);
                done();
            }).catch(function () {
                done.fail();
            });

            $httpBackend.flush();
        });

        describe('should change BackgroundGeolocation state', function () {
            var configurationSpy,
                modeSpy;

            beforeEach(function () {
                configurationSpy = spyOn(BackgroundGeolocation, 'configure');
                modeSpy = spyOn(BackgroundGeolocation, 'switchMode');
            });

            it('going to background state should stop', function (done) {
                GeolocationService.enable().then(function () {
                    bgStartSpy.calls.reset();
                    bgStopSpy.calls.reset();
                    configurationSpy.calls.reset();
                    modeSpy.calls.reset();

                    BackgroundGeolocation.callbackFun['background']();

                    expect(configurationSpy).not.toHaveBeenCalled();
                    expect(modeSpy).not.toHaveBeenCalled();
                    expect(bgStartSpy).not.toHaveBeenCalled();
                    expect(bgStopSpy).toHaveBeenCalledTimes(1);

                    done();
                }).catch(function () {
                    done.fail();
                });

                $httpBackend.flush();
            });

            it('going to foreground state should restart', function (done) {
                GeolocationService.enable().then(function () {
                    BackgroundGeolocation.callbackFun['background']();

                    bgStartSpy.calls.reset();
                    bgStopSpy.calls.reset();
                    configurationSpy.calls.reset();
                    modeSpy.calls.reset();

                    BackgroundGeolocation.callbackFun['foreground']();

                    expect(configurationSpy).not.toHaveBeenCalled();
                    expect(modeSpy).not.toHaveBeenCalled();
                    expect(bgStartSpy).toHaveBeenCalledTimes(1);
                    expect(bgStopSpy).not.toHaveBeenCalled();

                    done();
                }).catch(function () {
                    done.fail();
                });

                $httpBackend.flush();
            });

            it('going to background state while recording should change configuration', function (done) {
                GeolocationService.enable().then(function () {
                    GeolocationService.startRecording({ parentId: 1, id: 1 }).then(function () {
                        bgStartSpy.calls.reset();
                        bgStopSpy.calls.reset();
                        configurationSpy.calls.reset();
                        modeSpy.calls.reset();

                        BackgroundGeolocation.callbackFun['background']();

                        expect(configurationSpy).toHaveBeenCalledTimes(1);
                        expect(modeSpy).not.toHaveBeenCalledWith(BackgroundGeolocation.FOREGROUND_MODE);
                        expect(bgStartSpy).not.toHaveBeenCalled();
                        expect(bgStopSpy).not.toHaveBeenCalled();

                        done();
                    });
                }).catch(function () {
                    done.fail();
                });

                $httpBackend.flush();
            });

            it('going back to foreground state while recording should change configuration ', function (done) {
                GeolocationService.enable().then(function () {
                    GeolocationService.startRecording({ parentId: 1, id: 1 }).then(function () {
                        BackgroundGeolocation.callbackFun['background']();

                        bgStartSpy.calls.reset();
                        bgStopSpy.calls.reset();
                        configurationSpy.calls.reset();
                        modeSpy.calls.reset();

                        BackgroundGeolocation.callbackFun['foreground']();

                        expect(configurationSpy).toHaveBeenCalledTimes(1);
                        expect(modeSpy).not.toHaveBeenCalledWith(BackgroundGeolocation.BACKGROUND_MODE);
                        expect(bgStartSpy).not.toHaveBeenCalled();
                        expect(bgStopSpy).not.toHaveBeenCalled();

                        done();
                    });
                }).catch(function () {
                    done.fail();
                });

                $httpBackend.flush();
            });
        });

        describe('should handle geolocation errors', function () {
            it('for position denied (code:1) it should restart BackgroundGeolocation', function (done) {
                GeolocationService.enable().then(function () {
                    geolocationEnableSpy.calls.reset();
                    geolocationDisableSpy.calls.reset();
                    geolocationStopRecordingSpy.calls.reset();

                    BackgroundGeolocation.callbackFun['error']({ code: 1, message: 'Position denied' });

                    expect(geolocationEnableSpy).toHaveBeenCalledTimes(1);
                    expect(geolocationDisableSpy).toHaveBeenCalledTimes(1);
                    expect(geolocationStopRecordingSpy).not.toHaveBeenCalled();
                    done();
                }).catch(function () {
                    done.fail();
                });

                $httpBackend.flush();
            });

            it('for position unavailable (code:2) while not recording it should stop geolocation', function (done) {
                GeolocationService.enable().then(function () {
                    geolocationEnableSpy.calls.reset();
                    geolocationDisableSpy.calls.reset();
                    geolocationStopRecordingSpy.calls.reset();

                    BackgroundGeolocation.callbackFun['error']({ code: 2, message: 'position unavailable' });

                    expect(geolocationEnableSpy).not.toHaveBeenCalled();
                    expect(geolocationDisableSpy).toHaveBeenCalledTimes(1);
                    expect(geolocationStopRecordingSpy).not.toHaveBeenCalled();
                    done();
                }).catch(function () {
                    done.fail();
                });

                $httpBackend.flush();
            });

            it('for position unavailable (code:2) while recording it should stop recording and geolocation', function (done) {
                GeolocationService.enable().then(function () {
                    GeolocationService.startRecording({
                        parentId: 1,
                        id: 1
                    }).then(function () {
                        geolocationEnableSpy.calls.reset();
                        geolocationDisableSpy.calls.reset();
                        geolocationStopRecordingSpy.calls.reset();

                        BackgroundGeolocation.callbackFun['error']({ code: 2, message: 'position unavailable' });

                        expect(geolocationEnableSpy).not.toHaveBeenCalled();
                        expect(geolocationDisableSpy).toHaveBeenCalledTimes(1);
                        expect(geolocationStopRecordingSpy).toHaveBeenCalledTimes(1);
                        done();
                    });
                }).catch(function () {
                    done.fail();
                });

                $httpBackend.flush();
            });

            it('for position timed out (code:3) it should reboot BackgroundGeolocation', function (done) {
                GeolocationService.enable().then(function () {
                    bgStartSpy.calls.reset();
                    bgStopSpy.calls.reset();
                    geolocationEnableSpy.calls.reset();
                    geolocationDisableSpy.calls.reset();
                    geolocationStopRecordingSpy.calls.reset();

                    BackgroundGeolocation.callbackFun['error']({ code: 3, message: 'timeout reached' });

                    expect(geolocationEnableSpy).not.toHaveBeenCalled();
                    expect(geolocationDisableSpy).not.toHaveBeenCalled();
                    expect(geolocationStopRecordingSpy).not.toHaveBeenCalled();
                    expect(bgStopSpy).toHaveBeenCalledTimes(1);
                    expect(bgStartSpy).toHaveBeenCalledTimes(1);
                    done();
                }).catch(function () {
                    done.fail();
                });

                $httpBackend.flush();
            });

            it('for unknown error (code:?) it should reboot BackgroundGeolocation', function (done) {
                GeolocationService.enable().then(function () {
                    bgStartSpy.calls.reset();
                    bgStopSpy.calls.reset();
                    geolocationEnableSpy.calls.reset();
                    geolocationDisableSpy.calls.reset();
                    geolocationStopRecordingSpy.calls.reset();

                    BackgroundGeolocation.callbackFun['error']({ code: 1000, message: 'unknown' });

                    expect(geolocationEnableSpy).not.toHaveBeenCalled();
                    expect(geolocationDisableSpy).not.toHaveBeenCalled();
                    expect(geolocationStopRecordingSpy).not.toHaveBeenCalled();
                    expect(bgStopSpy).toHaveBeenCalledTimes(1);
                    expect(bgStartSpy).toHaveBeenCalledTimes(1);
                    done();
                }).catch(function () {
                    done.fail();
                });

                $httpBackend.flush();
            });
        });
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });
});
