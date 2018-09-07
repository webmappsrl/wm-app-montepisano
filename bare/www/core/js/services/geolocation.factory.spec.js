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

    beforeEach(inject(function (_CONFIG_) {
        CONFIG = _CONFIG_;
        if (CONFIG.NAVIGATION) {
            CONFIG.NAVIGATION.enableTrackRecording = true;
        } else {
            CONFIG.NAVIGATION = {
                enableTrackRecording: true
            }
        }
        currentLat = CONFIG.MAP.bounds.northEast[0] + (CONFIG.MAP.bounds.southWest[0] - CONFIG.MAP.bounds.northEast[0]) / 2;
        currentLong = CONFIG.MAP.bounds.northEast[1] + (CONFIG.MAP.bounds.southWest[1] - CONFIG.MAP.bounds.northEast[1]) / 2;
    }));

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
        BackgroundGeolocation = {
            start: function () {},
            stop: function () {},
            removeAllListeners: function () {},
            events: [],
            startTask: function (callback) {
                callback();
            },
            endTask: function () {},
            configure: function (params) {},
            on: function (event, callback) {
                if (event === 'location') {
                    this.callbackFun = callback;
                }
            },
            checkStatus: function (callback) {
                callback({})
            },
            callbackFun: null
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

        spyOn(MapService, 'createUserPolyline').and.callFake(function () {});
        spyOn(MapService, 'updateUserPolyline').and.callFake(function () {});
        spyOn(MapService, 'getUserPolyline').and.callFake(function () {});
        spyOn(MapService, 'removeUserPolyline').and.callFake(function () {});
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
            GeolocationService.enable().then(function () {
                fail("it should not be resolved");
            }).catch(function (err) {
                expect(err).toEqual(ERRORS.CORDOVA_UNAVAILABLE);
                done();
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
                    expect(value).toEqual(expectedState);
                    expect(GeolocationService.isActive()).toBe(true);
                    done();
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
                    done();
                }).catch(function (err) {
                    expect(err).toEqual(ERRORS.GPS_DISABLED);
                    expect(GeolocationService.isActive()).toBe(false);
                    done();
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

        // NOT POSSIBLE DUE TO CODE
        it('no param, state === isActive && isLoading && !isFollowing && !isRotating => it should resolve promise with current state', function (done) {
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function (params) {
                var defer = $q.defer();
                GeolocationService.switchState()
                    .then(function (val) {
                        // console.log(val);
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
            GeolocationService.enable().then(function () {});

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
        })

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
        })

        it('recordingState.isActive &&  params defined  => it should not restart recording and reject promise with error code', function (done) {
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
        })

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    })

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
                })
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
    })

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

            var timeToTick = 2000;
            GeolocationService.enable().then(function (val) {
                GeolocationService.startRecording({
                    parentId: 1,
                    id: 1
                }).then(function (val) {
                    var requestDate = new Date(Date.now() + timeToTick);
                    jasmine.clock().mockDate(requestDate)
                    var distanceExpected = Utils.distanceInMeters(currentLat, currentLong, currentLat + 0.001, currentLong);
                    BackgroundGeolocation.callbackFun({
                        latitude: (currentLat + 0.001),
                        longitude: currentLong,
                        altitude: 0,
                        accuracy: 10
                    });

                    GeolocationService.getStats().then(function (val) {
                        var timeValue = Math.floor(val.time / 1000);
                        var currentSpeedValue = Math.floor(val.currentSpeed);
                        var averageSpeedValue = Math.floor(val.averageSpeed);
                        expect(timeValue).toBe(timeToTick / 1000);
                        expect(val.distance).toEqual(distanceExpected);
                        var speed = Math.floor(distanceExpected / (timeToTick) * 3600);
                        expect(currentSpeedValue).toEqual(speed);
                        expect(averageSpeedValue).toEqual(speed);
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
    })

    describe("handleToast", function () {
        var outOfTrackToastDelay = 10000;
        var spyShowToast;
        var spyHideToast;
        var spyMakeSound;
        var callPositionCallback = function (lat, long) {
            BackgroundGeolocation.callbackFun({
                latitude: lat,
                longitude: long,
                altitude: 0,
                accuracy: 10
            });
        };

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
            spyShowToast = spyOn(Utils, 'showToast').and.callFake(function () {});
            spyHideToast = spyOn(Utils, 'hideToast').and.callFake(function () {});
            spyMakeSound = spyOn(Utils, 'makeNotificationSound').and.callFake(function () {});
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
                    fail("it should resolve promise and start recording")
                })
            }).catch(function (err) {
                fail("it should resolve promise and enable gps")
            })
            $httpBackend.flush();
        });

        it("out of track  since (outOfTrackToastDelay+1) sec => it should show toast", function (done) {
            spyOn(window.turf.pointToLineDistance, 'default').and.callThrough();
            GeolocationService.enable().then(function (val) {
                GeolocationService.startRecording({
                    parentId: 1,
                    id: 1
                }).then(function () {
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

        it("out of track since (outOfTrackToastDelay-1) sec => it should not show toast", function (done) {
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

        it("Back in from outside track since (outOfTrackToastDelay+1) sec => it should not show (hide if open) toast ", function (done) {
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

        it("Back in from outside track since (outOfTrackToastDelay-1) sec => it should continue to show toast", function (done) {
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

        it("Back in from outside track before (outOfTrackToastDelay) interval  => it should not show toast", function (done) {
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
                BackgroundGeolocation.callbackFun({
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
                    BackgroundGeolocation.callbackFun({
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

    })

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });
});