describe('Geolocation.Factory', function() {


    beforeEach(module('webmapp'));

    var GeolocationService,
        $cordovaDeviceOrientation,
        $ionicPopup,
        $q,
        $translate,
        MapService,
        $httpBackend;

    beforeEach(inject(function(_GeolocationService_, _$cordovaDeviceOrientation_, _$ionicPopup_, _$q_, _$translate_, _MapService_, _$httpBackend_) {
        GeolocationService = _GeolocationService_;
        $cordovaDeviceOrientation = _$cordovaDeviceOrientation_;
        $ionicPopup = _$ionicPopup_;
        $q = _$q_;
        $translate = _$translate_;
        MapService = _MapService_;
        $httpBackend = _$httpBackend_;
        $httpBackend.whenGET().respond(404);
    }));



    describe('enable', function() {

        xit('cordova is not defined => it should reject promise', function(done) {
            window.cordova = undefined;
            var promise = GeolocationService.enable();
            promise.then(function() {
                new Error("it should not be resolved");
            }).catch(function(err) {

                expect(err).toEqual("Cordova not available");
            });
            done();
            $httpBackend.flush();
        });

        it('cordova is  defined => it should resolve  promise', function(done) {

            var promise = GeolocationService.enable();
            promise.then(function() {
                console.log("HERE");
            }).catch(function(err) {
                new Error("it should not be resolved");
            })
            done();
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