describe('MainController', function() {

    beforeEach(module('webmapp'));


    describe('test controller', function() {
        var scope, vm;
        var MapService;
        var CONFIG;

        beforeEach(inject(function($rootScope, $controller, _MapService_) {
            scope = $rootScope.$new();
            vm = $controller('MainController', { $scope: scope });
            MapService = _MapService_;
            // spyOn(MapService, 'getFeatureById');
        }));

        it('It shoud be definbed', function() {

            expect(vm).toBeDefined();
        });
        it('Function and variables shoud be be defined', function() {


            expect(vm.checkOutOfTrack).toBeDefined();
            expect(vm.stopNavigationUrlParams).toBeDefined();
            expect(vm.maxOutOfTrack).toBeDefined();
            // expect(vm.maxOutOfTrack).toBe(100);
            expect(vm.outOfTrackDate).toBeDefined();
            expect(vm.inTrackDate).toBeDefined();


        });

        it('Map service has been called.', function() {

            spyOn(vm, 'checkOutOfTrack');
            spyOn(MapService, 'getFeatureById');
            vm.checkOutOfTrack();
            vm.stopNavigationUrlParams.parentId = "Tappe";
            vm.stopNavigationUrlParams.id = 170;

            expect(vm.checkOutOfTrack).toHaveBeenCalled();
            expect(MapService.getFeatureById).toHaveBeenCalled();


        });


    });

});