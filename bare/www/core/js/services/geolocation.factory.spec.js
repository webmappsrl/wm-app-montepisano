describe('Geolocation.Factory', function () {


    beforeEach(module('webmapp'));

    var GeolocationService,
        $cordovaDeviceOrientation,
        $cordovaGeolocation,
        $ionicPopup,
        $q,
        $translate,
        MapService,
        $httpBackend;

    beforeEach(function () {
        window.cordova = {
            plugins: {
                diagnostic: {
                    permissionStatus: { GRANTED: 1, GRANTED_WHEN_IN_USE: 2, DENIED: 3, DENIED_ALWAYS: 4 },
                    locationAuthorizationMode: { ALWAYS: 1 },
                    status: 1,
                    locationEnableParam: true,
                    registerLocationStateChangeHandler: function (value) {
                        console.log("MOCK registerLocationStateChangeHandler");
                        return value
                    },
                    isLocationAuthorized: function (callback) {
                        console.log("MOCK isLocationAuthorized");
                        callback()
                    },
                    requestLocationAuthorization: function (callback, error, param) {
                        console.log("MOCK requestLocationAuthorization");
                        callback(this.status)
                    },
                    isGpsLocationEnabled: function (callback, err, param) {
                        console.log("MOCK isGpsLocationEnabled");
                        callback(this.locationEnableParam);
                    },
                    isLocationEnabled: function (callback, err, param) {
                        console.log("MOCK isLocationEnabled");
                        callback(this.locationEnableParam);
                    },
                    switchToSettings: function () { },
                    switchToLocationSettings: function () { }
                }
            },
            platformId: 'android'
        };
    });

    beforeEach(inject(function (_GeolocationService_, _$cordovaGeolocation_, _$cordovaDeviceOrientation_, _$ionicPopup_, _$q_, _$translate_, _MapService_, _$httpBackend_) {
        GeolocationService = _GeolocationService_;
        $cordovaDeviceOrientation = _$cordovaDeviceOrientation_;
        $cordovaGeolocation = _$cordovaGeolocation_;
        $ionicPopup = _$ionicPopup_;
        $q = _$q_;
        $translate = _$translate_;
        MapService = _MapService_;
        $httpBackend = _$httpBackend_;
        $httpBackend.whenGET().respond(404);
    }));

    beforeEach(function () {

        spyOn($cordovaGeolocation, 'getCurrentPosition').and.callFake(function () {
            var defer = $q.defer();
            console.log("MOCK cordovaGeolocation.getCurrentPosition");
            defer.resolve({ coords: { latitude: 43.718, longitude: 10.4, altitude: 0 } });
            return defer.promise;
        })
        spyOn(MapService, 'drawPosition').and.callFake(function () {
            console.log("MOCK MapService.drawPosition");
            return true;
        }),
            spyOn(MapService, 'removePosition').and.callFake(function () {
                console.log("MOCK MapService.removePosition");
                return true;
            })
        spyOn(MapService, 'centerOnCoords').and.callFake(function () {
            console.log("MOCK MapService.centerOnCoords");
            return true;
        })
        spyOn(MapService, 'getZoom').and.callFake(function () {
            console.log("MOCK MapService.getZoom");
            return true;
        })
        spyOn(MapService, 'mapIsRotating').and.callFake(function () {
            console.log("MOCK MapService.mapIsRotating");
            return true;
        })
        spyOn($ionicPopup, 'confirm').and.callFake(function () {
            console.log("MOCK $ionicPopup.confirm")
            var defer = $q.defer();
            defer.resolve(true);
            return defer.promise;
        })
        spyOn($ionicPopup, 'alert').and.callFake(function () {
            console.log("MOCK $ionicPopup.alert")
            var defer = $q.defer();
            defer.resolve(true);
            return defer.promise;
        })
    })

    describe('enable', function () {

        it('cordova is not defined => it should reject promise', function (done) {

            window.cordova = undefined;
            expect(GeolocationService.isActive()).toBe(false);
            var promise = GeolocationService.enable();
            promise.then(function () {
                done(new Error("it should not be resolved"));
            }).catch(function (err) {
                done();
                expect(err).toEqual(ERRORS.CORDOVA_UNAVAILABLE);
            });

            $httpBackend.flush();
        });

        it('cordova is defined, platform android, permission granted, isGpsLocationEnable => it should resolve promise and return true', function (done) {

            localStorage.clear()
            expect(GeolocationService.isActive()).toBe(false);
            var promise = GeolocationService.enable();
            promise.then(function (value) {
                done();
                expect(value).toBe(true);
                expect(GeolocationService.isActive()).toBe(true);
            }).catch(function (err) {
                done(new Error("it should be resolved"));
            })

            $httpBackend.flush();
        })

        it('cordova is defined, platform ios, permission granted, isLocationEnable => it should resolve promise and return true', function (done) {

            localStorage.clear()
            window.cordova.platformId = 'ios';
            expect(GeolocationService.isActive()).toBe(false);
            var promise = GeolocationService.enable();
            promise.then(function (value) {
                done();
                expect(value).toBe(true);
                expect(GeolocationService.isActive()).toBe(true);
            }).catch(function (err) {
                done(new Error("it should be resolved"));
            })

            $httpBackend.flush();
        })

        it('cordova is  defined, platform android,permission allow, not isGPSLocationEnable => it should not resolve promise and return error message', function (done) {

            localStorage.clear();
            window.cordova.plugins.diagnostic.locationEnableParam = false;
            var promise = GeolocationService.enable();
            promise.then(function (value) {
                done(new Error("it should not be resolved"));
            }).catch(function (err) {
                done();
                expect(err).toEqual(ERRORS.GPS_DISABLED);
                expect(GeolocationService.isActive()).toBe(false);
            })

            $httpBackend.flush();
        })

        it('cordova is  defined, platform ios,permission allow, not isLocationEnable => it should not resolve promise and return error message', function (done) {

            localStorage.clear();
            window.cordova.platformId = 'ios';
            window.cordova.plugins.diagnostic.locationEnableParam = false;
            var promise = GeolocationService.enable();
            promise.then(function (value) {
                done(new Error("it should not be resolved"));
            }).catch(function (err) {
                done();
                expect(err).toEqual(ERRORS.GPS_DISABLED);
                expect(GeolocationService.isActive()).toBe(false);
            })

            $httpBackend.flush();
        })

        it('cordova is  defined, platform android,permission DENY => it should not resolve promise and return error message', function (done) {

            localStorage.clear();
            window.cordova.platformId = 'android';
            window.cordova.plugins.diagnostic.status = window.cordova.plugins.diagnostic.permissionStatus.DENIED;
            var promise = GeolocationService.enable();
            promise.then(function (value) {
                done(new Error("it should not be resolved"));
            }).catch(function (err) {
                done();
                expect(err).toEqual(ERRORS.GPS_PERMISSIONS_DENIED);
                expect(GeolocationService.isActive()).toBe(false);
            })

            $httpBackend.flush();
        })

        it('cordova is  defined, platform ios,permission DENY => it should not resolve promise and return error message', function (done) {

            localStorage.clear();
            window.cordova.platformId = 'ios';
            window.cordova.plugins.diagnostic.status = window.cordova.plugins.diagnostic.permissionStatus.DENIED;
            var promise = GeolocationService.enable();
            promise.then(function (value) {
                done(new Error("it should not be resolved"));
            }).catch(function (err) {
                done();
                expect(err).toEqual(ERRORS.GPS_PERMISSIONS_DENIED);
                expect(GeolocationService.isActive()).toBe(false);
            })

            $httpBackend.flush();
        })


        it('cordova is  defined, gps already active => it should not resolve promise and return error message', function (done) {

            localStorage.clear();
            expect(GeolocationService.isActive()).toBe(false);
            var promise = GeolocationService.enable();
            promise.then(function (value) {
                done();
                expect(value).toBe(true);
                expect(GeolocationService.isActive()).toBe(true);
                var secondCallPromise = GeolocationService.enable();

                secondCallPromise.then(function (res) {

                    expect(GeolocationService.isActive()).toBe(true);
                    expect(res.isActive).toBe(true);
                }).catch(function () {
                    done(new Error("it should resolve promise"));
                })
            }).catch(function (err) {
                done(new Error("it should resolve first promise and reject second"));
            })

            $httpBackend.flush();
        })

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('disable', function () {

        it('window.cordova is defined => it should disable geolocaiton, call MapService.removePosition', function () {

            var value = GeolocationService.disable();
            expect(value).toBe(true);
            expect(MapService.removePosition).toHaveBeenCalled();
            expect(GeolocationService.isActive()).toBe(false);

            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

})