describe('Geolocation.Factory', function() {


    beforeEach(module('webmapp'));

    var GeolocationService,
        CONFIG,
        $cordovaDeviceOrientation,
        $cordovaGeolocation,
        $ionicPopup,
        $q,
        $translate,
        MapService,
        $httpBackend;

    var currentLat, currentLong;

    beforeEach(function() {
        window.cordova = {
            plugins: {
                diagnostic: {
                    permissionStatus: { GRANTED: 1, GRANTED_WHEN_IN_USE: 2, DENIED: 3, DENIED_ALWAYS: 4 },
                    locationAuthorizationMode: { ALWAYS: 1 },
                    status: 1,
                    locationEnableParam: true,
                    registerLocationStateChangeHandler: function(value) {
                        console.log("MOCK registerLocationStateChangeHandler");
                        return value
                    },
                    isLocationAuthorized: function(callback) {
                        console.log("MOCK isLocationAuthorized");
                        callback()
                    },
                    requestLocationAuthorization: function(callback, error, param) {
                        console.log("MOCK requestLocationAuthorization");
                        callback(this.status)
                    },
                    isGpsLocationEnabled: function(callback, err, param) {
                        console.log("MOCK isGpsLocationEnabled");
                        callback(this.locationEnableParam);
                    },
                    isLocationEnabled: function(callback, err, param) {
                        console.log("MOCK isLocationEnabled");
                        callback(this.locationEnableParam);
                    },
                    switchToSettings: function() {},
                    switchToLocationSettings: function() {}
                }
            },
            platformId: 'android'
        };
    });

    beforeEach(inject(function(_GeolocationService_, _$cordovaGeolocation_, _$cordovaDeviceOrientation_, _$ionicPopup_, _$q_, _$translate_, _MapService_, _$httpBackend_, _CONFIG_) {
        GeolocationService = _GeolocationService_;
        $cordovaDeviceOrientation = _$cordovaDeviceOrientation_;
        $cordovaGeolocation = _$cordovaGeolocation_;
        $ionicPopup = _$ionicPopup_;
        $q = _$q_;
        $translate = _$translate_;
        MapService = _MapService_;
        $httpBackend = _$httpBackend_;
        CONFIG = _CONFIG_;

        currentLat = CONFIG.MAP.bounds.northEast[0] + (CONFIG.MAP.bounds.southWest[0] - CONFIG.MAP.bounds.northEast[0]) / 2;
        currentLong = CONFIG.MAP.bounds.northEast[1] + (CONFIG.MAP.bounds.southWest[1] - CONFIG.MAP.bounds.northEast[1]) / 2;

        $httpBackend.whenGET().respond(404);
    }));

    beforeEach(function() {

        spyOn(MapService, 'drawPosition').and.callFake(function() {
            console.log("MOCK MapService.drawPosition");
            return true;
        })
        spyOn(MapService, 'removePosition').and.callFake(function() {
            console.log("MOCK MapService.removePosition");
            return true;
        })
        spyOn(MapService, 'centerOnCoords').and.callFake(function() {
            console.log("MOCK MapService.centerOnCoords");
            return true;
        })
        spyOn(MapService, 'getZoom').and.callFake(function() {
            console.log("MOCK MapService.getZoom");
            return true;
        })
        spyOn(MapService, 'mapIsRotating').and.callFake(function() {
            console.log("MOCK MapService.mapIsRotating");
            return true;
        })
        spyOn($ionicPopup, 'confirm').and.callFake(function() {
            console.log("MOCK $ionicPopup.confirm")
            var defer = $q.defer();
            defer.resolve(true);
            return defer.promise;
        })
        spyOn($ionicPopup, 'alert').and.callFake(function() {
                console.log("MOCK $ionicPopup.alert")
                var defer = $q.defer();
                defer.resolve(true);
                return defer.promise;
            })
            // spyOn($cordovaDeviceOrientation, 'watchHeading').and.callFake(function() {
            //     console.log("MOCK $cordovaDeviceOrientation.watchHeading")
            //     var defer = $q.defer();

        //     defer.promise.clearWatch = function() {};

        //     return defer.promise;
        // })
    })

    describe('enable', function() {

        it('cordova is not defined => it should reject promise', function(done) {

            window.cordova = undefined;
            expect(GeolocationService.isActive()).toBe(false);
            var promise = GeolocationService.enable();
            promise.then(function() {
                done(new Error("it should not be resolved"));
            }).catch(function(err) {
                done();
                expect(err).toEqual(ERRORS.CORDOVA_UNAVAILABLE);
            });

            $httpBackend.flush();
        });

        it('cordova is defined, platform android, permission granted, isGpsLocationEnable => it should resolve promise and return true', function(done) {

            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function() {
                var defer = $q.defer();
                console.log("MOCK cordovaGeolocation.getCurrentPosition: " + currentLat + "," + currentLong);
                defer.resolve({ coords: { latitude: currentLat, longitude: currentLong, altitude: 0 } });
                return defer.promise;
            })
            localStorage.clear()
            expect(GeolocationService.isActive()).toBe(false);
            var promise = GeolocationService.enable();
            promise.then(function(value) {
                done();
                expect(value).toBe(true);
                expect(GeolocationService.isActive()).toBe(true);
            }).catch(function(err) {
                done(new Error("it should be resolved"));
            })

            $httpBackend.flush();
        })

        it('cordova is defined, platform android, permission granted, isGpsLocationEnable, outside bounding-box => it should reject promise and return error', function(done) {

            outsideLat = CONFIG.MAP.bounds.southWest[0] + 1;
            outsideLong = CONFIG.MAP.bounds.southWest[1] + 1;
            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function() {
                var defer = $q.defer();
                console.log("MOCK cordovaGeolocation.getCurrentPosition: " + outsideLat + "," + outsideLong);
                defer.resolve({ coords: { latitude: outsideLat, longitude: outsideLong, altitude: 0 } });
                return defer.promise;
            })
            localStorage.clear()
            expect(GeolocationService.isActive()).toBe(false);
            var promise = GeolocationService.enable();
            promise.then(function(value) {
                done(new Error("it should be rejected"));
            }).catch(function(err) {
                done();
                expect(err).toBe(ERRORS.OUTSIDE_BOUNDING_BOX);
                expect(GeolocationService.isActive()).toBe(false);
            })

            $httpBackend.flush();
        })

        it('cordova is defined, platform ios, permission granted, isLocationEnable => it should resolve promise and return true', function(done) {

            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function() {
                var defer = $q.defer();
                console.log("MOCK cordovaGeolocation.getCurrentPosition: " + currentLat + "," + currentLong);
                defer.resolve({ coords: { latitude: currentLat, longitude: currentLong, altitude: 0 } });
                return defer.promise;
            })
            localStorage.clear()
            window.cordova.platformId = 'ios';
            expect(GeolocationService.isActive()).toBe(false);
            var promise = GeolocationService.enable();
            promise.then(function(value) {
                done();
                expect(value).toBe(true);
                expect(GeolocationService.isActive()).toBe(true);
            }).catch(function(err) {
                done(new Error("it should be resolved"));
            })

            $httpBackend.flush();
        })

        it('cordova is  defined, platform android,permission allow, not isGPSLocationEnable => it should not resolve promise and return error message', function(done) {

            localStorage.clear();
            window.cordova.plugins.diagnostic.locationEnableParam = false;
            var promise = GeolocationService.enable();
            promise.then(function(value) {
                done(new Error("it should not be resolved"));
            }).catch(function(err) {
                done();
                expect(err).toEqual(ERRORS.GPS_DISABLED);
                expect(GeolocationService.isActive()).toBe(false);
            })

            $httpBackend.flush();
        })

        it('cordova is  defined, platform ios,permission allow, not isLocationEnable => it should not resolve promise and return error message', function(done) {

            localStorage.clear();
            window.cordova.platformId = 'ios';
            window.cordova.plugins.diagnostic.locationEnableParam = false;
            var promise = GeolocationService.enable();
            promise.then(function(value) {
                done(new Error("it should not be resolved"));
            }).catch(function(err) {
                done();
                expect(err).toEqual(ERRORS.GPS_DISABLED);
                expect(GeolocationService.isActive()).toBe(false);
            })

            $httpBackend.flush();
        })

        it('cordova is  defined, platform android,permission DENY => it should not resolve promise and return error message', function(done) {

            localStorage.clear();
            window.cordova.platformId = 'android';
            window.cordova.plugins.diagnostic.status = window.cordova.plugins.diagnostic.permissionStatus.DENIED;
            var promise = GeolocationService.enable();
            promise.then(function(value) {
                done(new Error("it should not be resolved"));
            }).catch(function(err) {
                done();
                expect(err).toEqual(ERRORS.GPS_PERMISSIONS_DENIED);
                expect(GeolocationService.isActive()).toBe(false);
            })

            $httpBackend.flush();
        })

        it('cordova is  defined, platform ios,permission DENY => it should not resolve promise and return error message', function(done) {

            localStorage.clear();
            window.cordova.platformId = 'ios';
            window.cordova.plugins.diagnostic.status = window.cordova.plugins.diagnostic.permissionStatus.DENIED;
            var promise = GeolocationService.enable();
            promise.then(function(value) {
                done(new Error("it should not be resolved"));
            }).catch(function(err) {
                done();
                expect(err).toEqual(ERRORS.GPS_PERMISSIONS_DENIED);
                expect(GeolocationService.isActive()).toBe(false);
            })

            $httpBackend.flush();
        })


        it('cordova is  defined, gps already active => it should not resolve promise and return error message', function(done) {

            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function() {
                var defer = $q.defer();
                console.log("MOCK cordovaGeolocation.getCurrentPosition: " + currentLat + "," + currentLong);
                defer.resolve({ coords: { latitude: currentLat, longitude: currentLong, altitude: 0 } });
                return defer.promise;
            })
            localStorage.clear();
            expect(GeolocationService.isActive()).toBe(false);
            var promise = GeolocationService.enable();
            promise.then(function(value) {
                done();
                expect(value).toBe(true);
                expect(GeolocationService.isActive()).toBe(true);
                var secondCallPromise = GeolocationService.enable();

                secondCallPromise.then(function(res) {

                    expect(GeolocationService.isActive()).toBe(true);
                    expect(res.isActive).toBe(true);
                }).catch(function() {
                    done(new Error("it should resolve promise"));
                })
            }).catch(function(err) {
                done(new Error("it should resolve first promise and reject second"));
            })

            $httpBackend.flush();
        })

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('disable', function() {

        it('window.cordova is defined => it should disable geolocation, call MapService.removePosition', function() {

            var value = GeolocationService.disable();
            expect(value).toBe(true);
            expect(MapService.removePosition).toHaveBeenCalled();
            expect(GeolocationService.isActive()).toBe(false);

            $httpBackend.flush();
        });

        it('window.cordova is undefined => it should resolve promise and return true', function() {

            expect(GeolocationService.isActive()).toBe(false);
            var value = GeolocationService.disable();
            expect(value).toBe(true);
            expect(GeolocationService.isActive()).toBe(false);

            $httpBackend.flush();
        });

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });



    describe('switchState', function() {

        it('GPS is not active => it should reject promise and return error message', function(done) {

            expect(GeolocationService.isActive()).toBe(false);
            var promise = GeolocationService.switchState({});
            promise.then(function(val) {
                done(new Error('it should reject promise'));
            }).catch(function(err) {
                done();
                expect(err).toEqual(ERRORS.GPS_DISABLED);
            });

            $httpBackend.flush();
        })

        it('no param, state === isActive && isLoading && !isFollowing && !isRotating => it should resolve promise with current state', function(done) {

            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function() {
                var defer = $q.defer();
                console.log("MOCK cordovaGeolocation.getCurrentPosition: " + currentLat + "," + currentLong);
                // setTimeout(function() { defer.resolve({ coords: { latitude: currentLat, longitude: currentLong, altitude: 0 } }) }, 10000);
                defer.resolve({ coords: { latitude: currentLat, longitude: currentLong, altitude: 0 } });
                return defer.promise;
            });

            var expectedState = {
                isActive: true,
                isLoading: true,
                isFollowing: false,
                isRotating: false
            };

            expect(GeolocationService.isActive()).toBe(false);
            var enablePromise = GeolocationService.enable();

            var promise = GeolocationService.switchState({});
            promise.then(function(val) {
                done();
                expect(val).toEqual(expectedState);
            }).catch(function(err) {
                done(new Error('it should resolve promise'));
            });

            $httpBackend.flush();
        });


        it('no param, state === isActive && !isLoading && !isFollowing && !isRotating  => it should switch state to follow and return modified state', function(done) {

            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function() {
                var defer = $q.defer();
                console.log("MOCK cordovaGeolocation.getCurrentPosition: " + currentLat + "," + currentLong);
                defer.resolve({ coords: { latitude: currentLat, longitude: currentLong, altitude: 0 } });
                return defer.promise;
            });

            var expectedState = {
                isActive: true,
                isLoading: false,
                isFollowing: true,
                isRotating: false
            };

            expect(GeolocationService.isActive()).toBe(false);

            var enablePromise = GeolocationService.enable().then(function() {
                done();
                var promise = GeolocationService.switchState();
                promise.then(function(val) {
                    done();
                    expect(val).toEqual(expectedState);
                }).catch(function(err) {
                    done(new Error('it should resolve promise'));
                });
            });

            $httpBackend.flush();
        });


        it('no param, state === isActive && !isLoading && isFollowing && !isRotating  => it should enable rotation and return modified state', function(done) {

            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function() {
                var defer = $q.defer();
                console.log("MOCK cordovaGeolocation.getCurrentPosition: " + currentLat + "," + currentLong);
                defer.resolve({ coords: { latitude: currentLat, longitude: currentLong, altitude: 0 } });
                return defer.promise;
            });

            spyOn($cordovaDeviceOrientation, 'watchHeading').and.callFake(function() {
                var defer = $q.defer();
                defer.resolve({ clearWatch: function() {} });
                defer.clearWatch = function() {};
                defer.promise.clearWatch = function() {};
                return defer.promise;
            });

            var expectedState = {
                isActive: true,
                isLoading: false,
                isFollowing: true,
                isRotating: true
            };

            expect(GeolocationService.isActive()).toBe(false);

            var enablePromise = GeolocationService.enable().then(function() {
                done();
                var promise = GeolocationService.switchState();
                promise.then(function(val) {
                    done();
                    expect(val).toEqual(expectedState);
                }).catch(function(err) {
                    done(new Error('it should resolve promise'));
                });
            });

            $httpBackend.flush();
        });

        it('goalState = isFollowing && !isRotating, state === isActive && !isLoading && isFollowing && isRotating  => it should disable rotation and return modified state', function(done) {

            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function() {
                var defer = $q.defer();
                console.log("MOCK cordovaGeolocation.getCurrentPosition: " + currentLat + "," + currentLong);
                defer.resolve({ coords: { latitude: currentLat, longitude: currentLong, altitude: 0 } });
                return defer.promise;
            });

            spyOn($cordovaDeviceOrientation, 'watchHeading').and.callFake(function() {
                var defer = $q.defer();
                defer.resolve({ clearWatch: function() {} });
                defer.clearWatch = function() {};
                defer.promise.clearWatch = function() {};
                return defer.promise;
            });

            var expectedState = {
                isActive: true,
                isLoading: false,
                isFollowing: true,
                isRotating: false
            };

            expect(GeolocationService.isActive()).toBe(false);

            var enablePromise = GeolocationService.enable().then(function() {
                done();
                var promise = GeolocationService.switchState();
                promise.then(function(val) {
                    done();
                    var goalswitchState = GeolocationService.switchState(expectedState);
                    expect(val).toEqual({ isActive: true, isLoading: false, isFollowing: true, isRotating: true });
                    goalswitchState.then(function(val) {
                        done();
                        expect(val).toEqual(expectedState);
                    }).catch(function() {
                        done(new Error('it should resolve promise'));
                    })
                }).catch(function(err) {
                    done(new Error('it should resolve promise'));
                });
            });

            $httpBackend.flush();
        })

        it('goalState = isFollowing && isRotating, state === isActive && !isLoading && isFollowing && isRotating  => it should no change nothing resolve with current state', function(done) {

            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function() {
                var defer = $q.defer();
                console.log("MOCK cordovaGeolocation.getCurrentPosition: " + currentLat + "," + currentLong);
                defer.resolve({ coords: { latitude: currentLat, longitude: currentLong, altitude: 0 } });
                return defer.promise;
            });

            spyOn($cordovaDeviceOrientation, 'watchHeading').and.callFake(function() {
                var defer = $q.defer();
                defer.resolve({ clearWatch: function() {} });
                defer.clearWatch = function() {};
                defer.promise.clearWatch = function() {};
                return defer.promise;
            });

            var expectedState = {
                isActive: true,
                isLoading: false,
                isFollowing: true,
                isRotating: true
            };

            expect(GeolocationService.isActive()).toBe(false);

            var enablePromise = GeolocationService.enable().then(function() {
                done();
                var promise = GeolocationService.switchState();
                promise.then(function(val) {
                    done();
                    var goalswitchState = GeolocationService.switchState(expectedState);
                    expect(val).toEqual(expectedState);
                    goalswitchState.then(function(val) {
                        done();
                        expect(val).toEqual(expectedState);
                    }).catch(function() {
                        done(new Error('it should resolve promise'));
                    })
                }).catch(function(err) {
                    done(new Error('it should resolve promise'));
                });
            });

            $httpBackend.flush();
        })

        it('goalState = !isFollowing && !isRotating, state === isActive && !isLoading && isFollowing && isRotating  => it should disable rotation and resolve with modified state', function(done) {

            spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function() {
                var defer = $q.defer();
                console.log("MOCK cordovaGeolocation.getCurrentPosition: " + currentLat + "," + currentLong);
                defer.resolve({ coords: { latitude: currentLat, longitude: currentLong, altitude: 0 } });
                return defer.promise;
            });

            spyOn($cordovaDeviceOrientation, 'watchHeading').and.callFake(function() {
                var defer = $q.defer();
                defer.resolve({ clearWatch: function() {} });
                defer.clearWatch = function() {};
                defer.promise.clearWatch = function() {};
                return defer.promise;
            });

            var expectedState = {
                isActive: true,
                isLoading: false,
                isFollowing: false,
                isRotating: false
            };

            expect(GeolocationService.isActive()).toBe(false);

            var enablePromise = GeolocationService.enable().then(function() {
                done();
                var promise = GeolocationService.switchState();
                promise.then(function(val) {
                    done();
                    var goalswitchState = GeolocationService.switchState(expectedState);
                    expect(val).toEqual({ isActive: true, isLoading: false, isFollowing: true, isRotating: false });
                    goalswitchState.then(function(val) {
                        done();
                        expect(val).toEqual(expectedState);
                    }).catch(function() {
                        done(new Error('it should resolve promise'));
                    })
                }).catch(function(err) {
                    done(new Error('it should resolve promise'));
                });
            });

            $httpBackend.flush();
        })



        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

})