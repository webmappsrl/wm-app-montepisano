xdescribe('MainController', function () {

    beforeEach(module('webmapp'));

    var GeolocationService,
        CONFIG,
        $cordovaDeviceOrientation,
        $cordovaGeolocation,
        $ionicPopup,
        $ionicModal,
        $q,
        $translate,
        $rootScope,
        MapService,
        $httpBackend,
        Utils,
        MainController;
    var currentLat, currentLong;
    var userPoly = null;

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
                    switchToSettings: function () { },
                    switchToLocationSettings: function () { }
                }
            },
            platformId: 'android'
        };

        window.plugins = {
            insomnia: {
                allowSleepAgain: function () { },
                keepAwake: function () { }
            }
        };

        BackgroundGeolocation = {
            start: function () { },
            stop: function () { },
            removeAllListeners: function () { },
            events: [],
            startTask: function (callback) {
                callback();
            },
            endTask: function () { },
            configure: function (params) { },
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

    beforeEach(inject(function ($controller, _GeolocationService_, _$cordovaGeolocation_, _$cordovaDeviceOrientation_, _$ionicModal_, _$ionicPopup_, _$q_, _$translate_, _$rootScope_, _MapService_, _$httpBackend_, _Utils_) {
        GeolocationService = _GeolocationService_;
        $cordovaDeviceOrientation = _$cordovaDeviceOrientation_;
        $cordovaGeolocation = _$cordovaGeolocation_;
        $ionicPopup = _$ionicPopup_;
        $ionicModal = _$ionicModal_;
        $q = _$q_;
        $translate = _$translate_;
        MapService = _MapService_;
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
        Utils = _Utils_;

        var scope = $rootScope.$new();
        spyOn($ionicModal, 'fromTemplateUrl').and.callFake(function () {
            var deferred = $q.defer();
            deferred.resolve({
                show: function () { },
                hide: function () { }
            });
            return deferred.promise;
        });
        spyOn(Utils, 'createModal').and.callFake(function () {
            var deferred = $q.defer();
            deferred.resolve({
                show: function () { },
                hide: function () { },
                remove: function () { }
            });
            return deferred.promise;
        })
        MainController = $controller('MainController', {
            '$scope': scope,
            $ionicModal: $ionicModal,
            Utils: Utils
        });

        userPoly = null;
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
        spyOn(MapService, 'createUserPolyline').and.callFake(function (value) {
            if (userPoly == null) {
                userPoly = {
                    coords: value,
                    getLatLngs: function () {
                        return this.coords;
                    }
                }
            }
        });
        spyOn(MapService, 'updateUserPolyline').and.callFake(function (val) {
            userPoly.coords.push(val);
        });
        spyOn(MapService, 'getUserPolyline').and.callFake(function () {
            return userPoly;
        });
        spyOn(MapService, 'removeUserPolyline').and.callFake(function () {
            userPoly = null;
        });
    });

    describe('recordingTrack', function () {
        it('submbitData', function () {
            GeolocationService.enable().then(function () {
                MainController.startNavigation(true);

                BackgroundGeolocation.callbackFun({
                    latitude: currentLat,
                    longitude: currentLong,
                    altitude: 0,
                    accuracy: 10
                });

                BackgroundGeolocation.callbackFun({
                    latitude: currentLat + 0.002,
                    longitude: currentLong,
                    altitude: 0,
                    accuracy: 10
                });

                MainController.stopNavigation();
            })

            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });
});
