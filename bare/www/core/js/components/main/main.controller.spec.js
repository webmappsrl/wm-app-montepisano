describe('MainController', function() {

    beforeEach(module('webmapp'));


    describe('MainController', function() {
        var scope, rootScope, vm;
        var MapService;
        var CONFIG;
        var $q;
        var deferred;
        var $httpBackend;

        beforeEach(inject(function(_$httpBackend_, _$rootScope_, $controller, _$q_, _MapService_) {

            rootScope = _$rootScope_;
            scope = _$rootScope_.$new();
            MapService = _MapService_;
            $httpBackend = _$httpBackend_;
            vm = $controller('MainController', { $scope: scope });

            $q = _$q_;

        }));



        it('Call checkOutOfTrack successfully  ', function() {


            spyOn(window.turf.pointToLineDistance, 'default').and.returnValue(10);
            vm.stopNavigationUrlParams.parentId = 'Tappe';
            vm.stopNavigationUrlParams.id = 170;
            deferred = $q.defer();

            var feature = {
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: [
                        [125.6, 10.1],
                        [1, 1]
                    ]
                }
            };
            spyOn(MapService, 'getFeatureById').and.returnValue(deferred.promise);
            spyOn(vm, 'handleDistanceToast').and.callThrough();
            $httpBackend.whenGET(function(url) { return true; }).respond(200);
            vm.checkOutOfTrack([47.718, 10.4]);
            deferred.resolve(feature);

            rootScope.$digest();

            expect(MapService.getFeatureById).toHaveBeenCalled();
            expect(window.turf.pointToLineDistance.default).toHaveBeenCalled();
            expect(vm.handleDistanceToast).toHaveBeenCalledWith(10);

        });


    });

});