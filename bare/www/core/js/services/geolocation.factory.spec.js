describe('Geolocation.Factory', function () {

    beforeEach(module('webmapp'));

    var GeolocationService,
        CONFIG,
        $cordovaDeviceOrientation,
        $cordovaGeolocation,
        $ionicPopup,
        $q,
        $translate,
        $rootScope,
        MapService,
        $httpBackend,
        Utils;
    var currentLat, currentLong;

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
                    status: 1,
                    locationEnableParam: true,
                    registerLocationStateChangeHandler: function (value) {
                        // console.log("MOCK registerLocationStateChangeHandler");
                        return value
                    },
                    isLocationAuthorized: function (callback) {
                        // console.log("MOCK isLocationAuthorized");
                        callback()
                    },
                    requestLocationAuthorization: function (callback, error, param) {
                        // console.log("MOCK requestLocationAuthorization");
                        callback(this.status)
                    },
                    isGpsLocationEnabled: function (callback, err, param) {
                        // console.log("MOCK isGpsLocationEnabled");
                        callback(this.locationEnableParam);
                    },
                    isLocationEnabled: function (callback, err, param) {
                        // console.log("MOCK isLocationEnabled");
                        callback(this.locationEnableParam);
                    },
                    switchToSettings: function () {},
                    switchToLocationSettings: function () {}
                }
            },
            platformId: 'android'
        };
        backgroundGeolocation = {
            start: function () {},
            stop: function () {},
            configure: function (callback, error, params) {
                callback({
                    latitude: currentLat,
                    longitude: currentLong,
                    altitude: 0,
                    accuracy: 10
                });
                this.callbackFun = callback;
            },
            finish: function () {},
            callbackFun: null
        };


    });

    beforeEach(inject(function (_GeolocationService_, _$cordovaGeolocation_, _$cordovaDeviceOrientation_, _$ionicPopup_, _$q_, _$translate_, _$rootScope_, _MapService_, _$httpBackend_, _CONFIG_, _Utils_) {
        GeolocationService = _GeolocationService_;
        $cordovaDeviceOrientation = _$cordovaDeviceOrientation_;
        $cordovaGeolocation = _$cordovaGeolocation_;
        $ionicPopup = _$ionicPopup_;
        $q = _$q_;
        $translate = _$translate_;
        MapService = _MapService_;
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
        CONFIG = _CONFIG_;
        Utils = _Utils_;
        currentLat = CONFIG.MAP.bounds.northEast[0] + (CONFIG.MAP.bounds.southWest[0] - CONFIG.MAP.bounds.northEast[0]) / 2;
        currentLong = CONFIG.MAP.bounds.northEast[1] + (CONFIG.MAP.bounds.southWest[1] - CONFIG.MAP.bounds.northEast[1]) / 2;

        $httpBackend.whenGET().respond(404);
    }));

    beforeEach(function () {
        spyOn(MapService, 'drawPosition').and.callFake(function () {
            // console.log("MOCK MapService.drawPosition");
            return true;
        });
        spyOn(MapService, 'drawAccuracy').and.callFake(function () {
            // console.log("MOCK MapService.drawAccuracy");
            return true;
        });
        spyOn(MapService, 'removePosition').and.callFake(function () {
            // console.log("MOCK MapService.removePosition");
            return true;
        });
        spyOn(MapService, 'centerOnCoords').and.callFake(function () {
            // console.log("MOCK MapService.centerOnCoords");
            return true;
        });
        spyOn(MapService, 'getZoom').and.callFake(function () {
            // console.log("MOCK MapService.getZoom");
            return true;
        });
        spyOn(MapService, 'mapIsRotating').and.callFake(function () {
            // console.log("MOCK MapService.mapIsRotating");
            return true;
        });
        spyOn(MapService, 'triggerNearestPopup').and.callFake(function () {
            // console.log("MOCK MapService.mapIsRotating");
            return true;
        });
        spyOn($ionicPopup, 'confirm').and.callFake(function () {
            // console.log("MOCK $ionicPopup.confirm")
            var defer = $q.defer();
            defer.resolve(true);
            return defer.promise;
        });
        spyOn($ionicPopup, 'alert').and.callFake(function () {
            // console.log("MOCK $ionicPopup.alert")
            var defer = $q.defer();
            defer.resolve(true);
            return defer.promise;
        });
        // spyOn($cordovaDeviceOrientation, 'watchHeading').and.callFake(function() {
        //     console.log("MOCK $cordovaDeviceOrientation.watchHeading")
        //     var defer = $q.defer();

        //     defer.promise.clearWatch = function() {};

        //     return defer.promise;
        // })
    })

    describe('enable', function () {

        it('cordova is not defined => it should reject promise', function (done) {
            window.cordova = undefined;
            expect(GeolocationService.isActive()).toBe(false);
            var promise = GeolocationService.enable();
            promise.then(function () {
                fail("it should not be resolved");
            }).catch(function (err) {
                done();
                expect(err).toEqual(ERRORS.CORDOVA_UNAVAILABLE);
            });

            $httpBackend.flush();
        });

        it('cordova is defined, platform android, permission granted, isGpsLocationEnabled => it should resolve promise and return true', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                // console.log("MOCK cordovaGeolocation.getCurrentPosition: " + currentLat + "," + currentLong);
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
                    done();
                    expect(value).toEqual(expectedState);
                    expect(GeolocationService.isActive()).toBe(true);
                }).catch(function (err) {
                    fail("it should be resolved");
                })

            $httpBackend.flush();
        });

        it('cordova is defined, platform ios, permission granted, isLocationEnabled => it should resolve promise and return true', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                // console.log("MOCK cordovaGeolocation.getCurrentPosition: " + currentLat + "," + currentLong);
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
                    done();
                    expect(value).toEqual(expectedState);
                    expect(GeolocationService.isActive()).toBe(true);
                }).catch(function (err) {
                    fail("it should be resolved");
                })

            $httpBackend.flush();
        });

        it('cordova is defined, platform android, permission allow, not isGPSLocationEnable => it should not resolve promise and return error message', function (done) {
            localStorage.clear();

            window.cordova.plugins.diagnostic.locationEnableParam = false;
            GeolocationService.enable()
                .then(function (value) {
                    fail("it should not be resolved");
                }).catch(function (err) {
                    done();
                    expect(err).toEqual(ERRORS.GPS_DISABLED);
                    expect(GeolocationService.isActive()).toBe(false);
                })

            $httpBackend.flush();
        });

        it('cordova is defined, platform ios, permission allow, not isLocationEnable => it should not resolve promise and return error message', function (done) {
            localStorage.clear();

            window.cordova.platformId = 'ios';
            window.cordova.plugins.diagnostic.locationEnableParam = false;
            GeolocationService.enable()
                .then(function (value) {
                    fail("it should not be resolved");
                }).catch(function (err) {
                    done();
                    expect(err).toEqual(ERRORS.GPS_DISABLED);
                    expect(GeolocationService.isActive()).toBe(false);
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
                    done();
                    expect(err).toEqual(ERRORS.GPS_PERMISSIONS_DENIED);
                    expect(GeolocationService.isActive()).toBe(false);
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
                    done();
                    expect(err).toEqual(ERRORS.GPS_PERMISSIONS_DENIED);
                    expect(GeolocationService.isActive()).toBe(false);
                })

            $httpBackend.flush();
        });

        it('cordova is defined, gps already active => it should not resolve promise and return error message', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                // console.log("MOCK cordovaGeolocation.getCurrentPosition: " + currentLat + "," + currentLong);
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
                    done();
                    expect(value).toEqual(expectedState);
                    expect(GeolocationService.isActive()).toBe(true);
                    var secondCallPromise = GeolocationService.enable();

                    secondCallPromise.then(function (res) {

                        expect(GeolocationService.isActive()).toBe(true);
                        expect(res.isActive).toBe(true);
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
                done();
                expect(err).toEqual(ERRORS.GPS_DISABLED);
            });

            $httpBackend.flush();
        });

        // NOT POSSIBLE DUE TO CODE
        it('no param, state === isActive && isLoading && !isFollowing && !isRotating => it should resolve promise with current state', function (done) {

            backgroundGeolocation = {
                start: function () {},
                stop: function () {},
                configure: function (callback, error, params) {},
                finish: function () {}
            };
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function (params) {
                // console.log(params);
                var defer = $q.defer();

                GeolocationService.switchState()
                    .then(function (val) {
                        // console.log(val);
                        done();
                        expect(expectedState).toEqual(val);
                        defer.resolve({
                            coords: {
                                latitude: currentLat,
                                longitude: currentLong,
                                altitude: 0,
                                accuracy: 10
                            }
                        });

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
            GeolocationService.enable().then(function () {
                done();
            });

            $httpBackend.flush();
        });

        it('no param, state === isActive && !isLoading && !isFollowing && !isRotating  => it should switch state to follow and return modified state', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                // console.log("MOCK cordovaGeolocation.getCurrentPosition: " + currentLat + "," + currentLong);
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


            backgroundGeolocation = {
                start: function () {},
                stop: function () {},
                configure: function (callback, error, params) {},
                finish: function () {}
            };

            var expectedState = {
                isActive: true,
                isLoading: false,
                isFollowing: true,
                isRotating: false
            };

            expect(GeolocationService.isActive()).toBe(false);
            GeolocationService.enable().then(function () {
                done();
                expect(GeolocationService.isActive()).toBe(true);
                GeolocationService.switchState()
                    .then(function (val) {
                        done();
                        var middleState = {
                            isActive: true,
                            isLoading: false,
                            isFollowing: true,
                            isRotating: true
                        }
                        expect(middleState).toEqual(val);
                        GeolocationService.switchState().then(function (val) {
                            done();
                            var rotationState = {
                                isActive: true,
                                isLoading: false,
                                isFollowing: true,
                                isRotating: false
                            }
                            expect(rotationState).toEqual(val);

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
                // console.log("MOCK cordovaGeolocation.getCurrentPosition: " + currentLat + "," + currentLong);
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
                    expect(val).toEqual(expectedState);
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
                // console.log("MOCK cordovaGeolocation.getCurrentPosition: " + currentLat + "," + currentLong);
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
                // console.log("MOCK cordovaGeolocation.getCurrentPosition: " + currentLat + "," + currentLong);
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
                // console.log("MOCK cordovaGeolocation.getCurrentPosition: " + currentLat + "," + currentLong);
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
                done();
                GeolocationService.switchState()
                    .then(function (val) {
                        done();
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

        it('goalState = isFollowing && !isRotating, state === isActive && !isLoading && isFollowing && !isRotating  => it should stay on the same state and resolve with current state', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                // console.log("MOCK cordovaGeolocation.getCurrentPosition: " + currentLat + "," + currentLong);
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
                done();
                GeolocationService.switchState(expectedState)
                    .then(function (value) {
                        done();
                        expect(value).toEqual(expectedState);
                    }).catch(function (err) {
                        fail('it should resolve promise');
                    });
            });

            $httpBackend.flush();
        });

        it('goalState = isFollowing && isRotating, state === isActive && !isLoading && isFollowing && !isRotating  => it should start rotating and resolve with current state', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                // console.log("MOCK cordovaGeolocation.getCurrentPosition: " + currentLat + "," + currentLong);
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
                done();
                GeolocationService.switchState(expectedState)
                    .then(function (val) {
                        done();
                        expect(val).toEqual(expectedState);
                    }).catch(function (err) {
                        fail('it should resolve promise');
                    });
            });

            $httpBackend.flush();
        });

        it('goalState = !isFollowing && !isRotating, state === isActive && !isLoading && isFollowing && !isRotating  => it should disable rotation and follow and resolve with modified state', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                // console.log("MOCK cordovaGeolocation.getCurrentPosition: " + currentLat + "," + currentLong);
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
                done();
                GeolocationService.switchState(expectedState)
                    .then(function (val) {
                        done();
                        expect(val).toEqual(expectedState);
                    }).catch(function (err) {
                        fail('it should resolve promise');
                    });
            });

            $httpBackend.flush();
        });

        it('goalState = isFollowing && !isRotating, state === isActive && !isLoading && !isFollowing && !isRotating  => it should start following and resolve with current state', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
                var defer = $q.defer();
                // console.log("MOCK cordovaGeolocation.getCurrentPosition: " + currentLat + "," + currentLong);
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
                done();
                GeolocationService.switchState()
                    .then(function () {
                        done();
                        GeolocationService.switchState()
                            .then(function () {
                                done();
                                GeolocationService.switchState(expectedState)
                                    .then(function (val) {
                                        done();
                                        expect(val).toEqual(expectedState);
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
                // console.log("MOCK cordovaGeolocation.getCurrentPosition: " + currentLat + "," + currentLong);
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
                done();
                GeolocationService.switchState()
                    .then(function () {
                        done();
                        GeolocationService.switchState()
                            .then(function () {
                                done();
                                GeolocationService.switchState(expectedState)
                                    .then(function (val) {
                                        done();
                                        expect(val).toEqual(expectedState);
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
                // console.log("MOCK cordovaGeolocation.getCurrentPosition: " + currentLat + "," + currentLong);
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
                done();
                GeolocationService.switchState()
                    .then(function () {
                        done();
                        GeolocationService.switchState()
                            .then(function () {
                                done();
                                GeolocationService.switchState(expectedState)
                                    .then(function (val) {
                                        done();
                                        expect(val).toEqual(expectedState);
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
        it('!recordingState.isActive  => it should start recording emitting a recordingState-changed and resolving with true', function (done) {
            spyOn($rootScope, '$emit');
            var promise = GeolocationService.startRecording();
            promise.then(function (val) {
                done();
                expect(val).toBe(true);
                expect($rootScope.$emit).toHaveBeenCalledWith('recordingState-changed', {
                    isActive: true,
                    isPaused: false
                });
            })
            $httpBackend.flush();
        })

        it('recordingState.isActive  => it should not restart recording and resolve promise with false', function (done) {
            var spy = spyOn($rootScope, '$emit');
            GeolocationService.startRecording().then(function (val) {
                done();
                expect(val).toBe(true);
                expect($rootScope.$emit).toHaveBeenCalledWith('recordingState-changed', {
                    isActive: true,
                    isPaused: false
                });
                spy.calls.reset();
                GeolocationService.startRecording().then(function (val) {
                    done();
                    expect($rootScope.$emit).not.toHaveBeenCalledWith('recordingState-changed', {
                        isActive: true,
                        isPaused: false
                    });
                    expect(val).toBe(false);
                });
            })
            $httpBackend.flush();
        })

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    })

    describe("pauseRecording", function () {
        it("!recordingState.isActive => it should resolve promise with false and  not emit recordingState-changed", function (done) {
            spyOn($rootScope, '$emit');
            GeolocationService.pauseRecording().then(function (val) {
                done();
                expect(val).toBe(false);
                expect($rootScope.$emit).not.toHaveBeenCalledWith('recordingState-changed', {
                    isActive: true,
                    isPaused: true
                });
            })
            $httpBackend.flush();
        });

        it("recordingState.isActive && !recordingState.isPaused => it should resolve promise with true and emit recordingState-changed", function (done) {
            spyOn($rootScope, '$emit');
            GeolocationService.startRecording().then(function (val) {
                done();
                GeolocationService.pauseRecording().then(function (val) {
                    done();
                    expect(val).toBe(true);
                    expect($rootScope.$emit).toHaveBeenCalledWith('recordingState-changed', {
                        isActive: true,
                        isPaused: true
                    });
                })
            });
            $httpBackend.flush();
        });

        it("recordingState.isActive && recordingState.isPaused => it should resolve promise with true and emit recordingState-changed", function (done) {
            var spy = spyOn($rootScope, '$emit');
            GeolocationService.startRecording().then(function (val) {
                done();
                GeolocationService.pauseRecording().then(function (val) {
                    done();
                    expect(val).toBe(true);
                    expect($rootScope.$emit).toHaveBeenCalledWith('recordingState-changed', {
                        isActive: true,
                        isPaused: true
                    });
                    spy.calls.reset();
                    GeolocationService.pauseRecording().then(function (val) {
                        done();
                        expect(val).toBe(false);
                        expect($rootScope.$emit).not.toHaveBeenCalledWith('recordingState-changed', {
                            isActive: true,
                            isPaused: true
                        });
                    });
                })
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
            spyOn($rootScope, '$emit');
            GeolocationService.resumeRecording().then(function (val) {
                done();
                expect(val).toBe(false);
                expect($rootScope.$emit).not.toHaveBeenCalled();
            });
            $httpBackend.flush();
        });

        it('recordingState.isActive && !recordingState.isPaused=>it should resolve promise with false and not emit recordingState-changed', function (done) {
            var spy = spyOn($rootScope, '$emit');
            GeolocationService.startRecording().then(function (val) {
                done();
                expect(val).toBe(true);
                expect($rootScope.$emit).toHaveBeenCalledWith('recordingState-changed', {
                    isActive: true,
                    isPaused: false
                });
                spy.calls.reset();
                GeolocationService.resumeRecording().then(function (val) {
                    done();
                    expect(val).toBe(false);
                    expect($rootScope.$emit).not.toHaveBeenCalled();
                });
            });
            $httpBackend.flush();
        });

        it('recordingState.isActive && recordingState.isPaused=>it should resolve promise with true and emit recordingState-changed', function (done) {
            var spy = spyOn($rootScope, '$emit');
            GeolocationService.startRecording().then(function (val) {
                done();
                expect(val).toBe(true);
                expect($rootScope.$emit).toHaveBeenCalledWith('recordingState-changed', {
                    isActive: true,
                    isPaused: false
                });
                spy.calls.reset();
                GeolocationService.pauseRecording().then(function () {
                    done();
                    expect(val).toBe(true);
                    expect($rootScope.$emit).toHaveBeenCalledWith('recordingState-changed', {
                        isActive: true,
                        isPaused: true
                    });
                    spy.calls.reset();
                    GeolocationService.resumeRecording().then(function (val) {
                        done();
                        expect(val).toBe(true);
                        expect($rootScope.$emit).toHaveBeenCalledWith('recordingState-changed', {
                            isActive: true,
                            isPaused: false
                        });
                    });
                });
            });
            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    })


    describe('recordingState.stopRecording', function () {

        it('!recordingState.isActive => it should resolve with false and not emit recordingState-changed', function (done) {
            spyOn($rootScope, '$emit');
            GeolocationService.stopRecording().then(function (val) {
                done();
                expect(val).toBe(false);
                expect($rootScope.$emit).not.toHaveBeenCalled();
            });
            $httpBackend.flush();
        });

        it('recordingState.isActive => it should resolve with true and emit recordingState-changed', function (done) {
            var spy = spyOn($rootScope, '$emit');
            GeolocationService.startRecording().then(function (val) {
                done();
                expect(val).toBe(true);
                expect($rootScope.$emit).toHaveBeenCalledWith('recordingState-changed', {
                    isActive: true,
                    isPaused: false
                });
                spy.calls.reset();
                GeolocationService.stopRecording().then(function (val) {
                    done();
                    expect(val).toBe(true);
                    expect($rootScope.$emit).toHaveBeenCalledWith('recordingState-changed', {
                        isActive: false,
                        isPaused: false
                    });
                });
            })
            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('getStats', function () {
        beforeEach(function () {
            jasmine.clock().install();
        })

        afterEach(function () {
            jasmine.clock().uninstall();
        })

        it('!recordingState.isActive => it should reject promise with false', function (done) {
            GeolocationService.getStats().then(function (val) {
                fail('it should reject promise');
            }).catch(function (err) {
                done();
                expect(err).toBe(false);
            });
            $httpBackend.flush();
        });

        it('recordingState.isActive => it should resolve promise with current stats', function (done) {
            spyOn($rootScope, '$emit');
            var timeToTick = 5000;

            GeolocationService.enable().then(function (val) {
                done();
                GeolocationService.startRecording().then(function (val) {
                    done();
                    expect(val).toBe(true);
                    expect($rootScope.$emit).toHaveBeenCalledWith('recordingState-changed', {
                        isActive: true,
                        isPaused: false
                    });

                    var distanceExpected = Utils.distanceInMeters(currentLat, currentLong, currentLat + 0.001, currentLong);
                    jasmine.clock().tick(timeToTick);
                    backgroundGeolocation.callbackFun({
                        latitude: currentLat + 0.001,
                        longitude: currentLong,
                        altitude: 0,
                        accuracy: 10
                    });
                    GeolocationService.getStats().then(function (val) {
                        expect(val.distance).toEqual(distanceExpected);
                        var speed = distanceExpected / timeToTick * 3600;
                        expect(val.currentSpeed).toEqual(speed);
                        expect(val.averageSpeed).toEqual(speed);
                    }).catch(function (err) {
                        fail('it should resolve promise');
                    });
                }).catch(function (err) {
                    fail('it should resolve promise');
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
    })

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });
});