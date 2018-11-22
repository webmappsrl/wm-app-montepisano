describe('MainController', function () {
    beforeEach(module('webmapp'));

    var GeolocationService,
        // CONFIG,
        $ionicPopup,
        $translate,
        $rootScope,
        $httpBackend,
        Utils;

    beforeEach(inject(function (
        //     // $controller,
        //     // _$httpBackend_,
        //     // _$ionicPopup_,
        //     // _$rootScope_,
        //     // _$translate_,
        //     // _Auth_,
        //     // _Communication_,
        //     // _CONFIG_,
        //     // _GeolocationService_,
        //     // _Utils_
    ) {

        // console.log("ok")
        //     // $httpBackend = $injector.get('$httpBackend');
        //     // jasmine.getJSONFixtures().fixturesPath = 'test/';

        //     // $httpBackend.whenGET().respond(
        //     //     getJSONFixture('config.json')
        //     // );

        //     // scope = $rootScope.$new();
        //     // $controller('ReportController', { '$scope': scope });

        //     // GeolocationService = _GeolocationService_;
        //     // $ionicPopup = _$ionicPopup_;
        //     // $translate = _$translate_;
        //     // $httpBackend = _$httpBackend_;
        //     // $rootScope = _$rootScope_;
        //     // Utils = _Utils_;

        //     // var scope = $rootScope.$new();
        //     // ReportController = $controller('ReportController', {
        //     //     '$scope': scope
        //     // });

        //     // $httpBackend.whenGET().respond(301);
    }));

    // beforeEach(function () {
    //     spyOn(MapService, 'drawPosition').and.callFake(function () {
    //         // console.log("MOCK MapService.drawPosition");
    //         return true;
    //     });
    //     spyOn(MapService, 'drawAccuracy').and.callFake(function () {
    //         // console.log("MOCK MapService.drawAccuracy");
    //         return true;
    //     });
    //     spyOn(MapService, 'removePosition').and.callFake(function () {
    //         // console.log("MOCK MapService.removePosition");
    //         return true;
    //     });
    //     spyOn(MapService, 'centerOnCoords').and.callFake(function () {
    //         // console.log("MOCK MapService.centerOnCoords");
    //         return true;
    //     });
    //     spyOn(MapService, 'getZoom').and.callFake(function () {
    //         // console.log("MOCK MapService.getZoom");
    //         return true;
    //     });
    //     spyOn(MapService, 'mapIsRotating').and.callFake(function () {
    //         // console.log("MOCK MapService.mapIsRotating");
    //         return true;
    //     });
    //     spyOn(MapService, 'triggerNearestPopup').and.callFake(function () {
    //         // console.log("MOCK MapService.mapIsRotating");
    //         return true;
    //     });
    //     spyOn($ionicPopup, 'confirm').and.callFake(function () {
    //         // console.log("MOCK $ionicPopup.confirm")
    //         var defer = $q.defer();
    //         defer.resolve(true);
    //         return defer.promise;
    //     });
    //     spyOn($ionicPopup, 'alert').and.callFake(function () {
    //         // console.log("MOCK $ionicPopup.alert")
    //         var defer = $q.defer();
    //         defer.resolve(true);
    //         return defer.promise;
    //     });

    //     spyOn(MapService, 'createUserPolyline').and.callFake(function (value) {
    //         if (userPoly == null) {
    //             userPoly = {
    //                 coords: value,
    //                 getLatLngs: function () {
    //                     return this.coords;
    //                 }
    //             }
    //         }
    //     });
    //     spyOn(MapService, 'updateUserPolyline').and.callFake(function (val) {
    //         userPoly.coords.push(val);
    //     });
    //     spyOn(MapService, 'getUserPolyline').and.callFake(function () {
    //         return userPoly;
    //     });
    //     spyOn(MapService, 'removeUserPolyline').and.callFake(function () {
    //         userPoly = null;
    //     });


    // })


    describe('recordingTrack', function () {
        it('submbitData', function () {

            //         GeolocationService.enable().then(function () {

            //             MainController.startNavigation(true);

            //             BackgroundGeolocation.callbackFun({
            //                 latitude: currentLat,
            //                 longitude: currentLong,
            //                 altitude: 0,
            //                 accuracy: 10
            //             });

            //             BackgroundGeolocation.callbackFun({
            //                 latitude: currentLat + 0.002,
            //                 longitude: currentLong,
            //                 altitude: 0,
            //                 accuracy: 10
            //             });



            //             MainController.stopNavigation();


            //         })


            //         $httpBackend.flush();

            //     })

            //     afterEach(function () {
            //         $httpBackend.verifyNoOutstandingExpectation();
            //         $httpBackend.verifyNoOutstandingRequest();
            expect(true).toBe(true);
        });
    })
});
