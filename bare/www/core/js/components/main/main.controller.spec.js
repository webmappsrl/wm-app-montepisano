describe('MainController', function() {

    beforeEach(module('webmapp'));


    describe('checkOutOfTrack', function() {
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


        it('Params defined=> should call function successfully', function() {

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
            $httpBackend.whenGET(function(url) { return true; }).respond(404, '');
            vm.checkOutOfTrack({ lat: 47.718, lng: 10.4 });
            deferred.resolve(feature);

            rootScope.$digest();
            $httpBackend.flush();

            expect(MapService.getFeatureById).toHaveBeenCalled();
            expect(window.turf.pointToLineDistance.default).toHaveBeenCalled();
            expect(vm.handleDistanceToast).toHaveBeenCalledWith(10);

        });


        it('Params undefined => Should not call MapService.getFeature.', function() {

            spyOn(MapService, 'getFeatureById');
            expect(vm.stopNavigationUrlParams.parentId).toBe(null);
            expect(vm.stopNavigationUrlParams.id).toBe(null);
            expect(MapService.getFeatureById).not.toHaveBeenCalled();
        });


        it('MapService.getfeatureById return rejected promise => Shoud go in catch block and print in log', function() {


            vm.stopNavigationUrlParams.parentId = 'Tappe';
            vm.stopNavigationUrlParams.id = 170;
            deferred = $q.defer();


            spyOn(MapService, 'getFeatureById').and.returnValue(deferred.promise);
            spyOn(vm, 'handleDistanceToast');
            spyOn(console, 'log');
            $httpBackend.whenGET(function(url) { return true; }).respond(404, '');
            vm.checkOutOfTrack({ lat: 47.718, lng: 10.4 });
            deferred.reject(vm.stopNavigationUrlParams);

            rootScope.$digest();

            $httpBackend.flush();

            expect(MapService.getFeatureById).toHaveBeenCalled();
            expect(vm.handleDistanceToast).not.toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith(vm.stopNavigationUrlParams);

        });

    });

    describe('handleDistanceToast', function() {


        var vm, scope;
        beforeEach(inject(function(_$rootScope_, $controller) {

            scope = _$rootScope_.$new();
            vm = $controller('MainController', { $scope: scope });

        }));


        it('Never gone outside track => it shoud not show toast.', function() {

            var distance = (vm.maxOutOfTrack) / 1000;
            // var baseTime = new Date(2013, 9, 23, 0, 0, 0, 0);
            // vm.inTrackDate = 0;
            // vm.outOfTrackDate = 0;
            // jasmine.clock().mockDate(baseTime);

            vm.handleDistanceToast(distance);

            expect(vm.outOfTrackDate).toBe(0);
            expect(vm.showToast).toBe(false);


        });

        it('After toast showed, back inside the track since (toastTime-2) seconds => it shoud show toast ', function() {

            var distance = (vm.maxOutOfTrack) / 1000;

            var baseTime = new Date(2013, 9, 23, 0, 0, 2, 0);
            vm.inTrackDate = new Date(2013, 9, 23, 0, 0, 0, 0);
            vm.showToast = true;
            jasmine.clock().mockDate(baseTime);

            vm.handleDistanceToast(distance);

            expect(vm.outOfTrackDate).toBe(0);
            expect(vm.showToast).toBe(true);


        });
        it('After toast not showed, back inside the track since (toastTime-2) seconds => it shoud show toast ', function() {

            var distance = (vm.maxOutOfTrack) / 1000;

            var baseTime = new Date(2013, 9, 23, 0, 0, 2, 0);
            vm.inTrackDate = new Date(2013, 9, 23, 0, 0, 0, 0);
            vm.showToast = false;
            jasmine.clock().mockDate(baseTime);

            vm.handleDistanceToast(distance);

            expect(vm.outOfTrackDate).toBe(0);
            expect(vm.showToast).toBe(false);


        });

        it('Back in from outside track since (timeToast+1) sec => it shoud not show(hide if open) toast ', function() {

            var distance = (vm.maxOutOfTrack) / 1000;
            var baseTime = new Date(2013, 9, 23, 0, 0, (vm.toastTime + 1), 0);
            vm.inTrackDate = new Date(2013, 9, 23, 0, 0, 0, 0);
            vm.showToast = true;
            jasmine.clock().mockDate(baseTime);

            vm.handleDistanceToast(distance);

            expect(vm.outOfTrackDate).toBe(0);
            expect(vm.showToast).toBe(false);


        });

        it('Ouf of track since (vm.toastTime - 1) sec => it shoud not show toast ', function() {

            var distance = (vm.maxOutOfTrack + 1) / 1000;
            var baseTime = new Date(2013, 9, 23, 0, 0, (vm.toastTime - 1), 0);
            vm.inTrackDate = 0;
            vm.outOfTrackDate = new Date(2013, 9, 23, 0, 0, 0, 0);;
            vm.showToast = false;
            jasmine.clock().mockDate(baseTime);

            vm.handleDistanceToast(distance);

            expect(vm.inTrackDate).toBe(0);
            expect(vm.showToast).toBe(false);


        });

        it('Ouf of track from (vm.toastTime + 1) sec => it shoud show toast ', function() {

            var distance = (vm.maxOutOfTrack + 1) / 1000;
            var baseTime = new Date(2013, 9, 23, 0, 0, (vm.toastTime + 1), 0);
            vm.inTrackDate = 0;
            vm.outOfTrackDate = new Date(2013, 9, 23, 0, 0, 0, 0);;
            vm.showToast = false;
            jasmine.clock().mockDate(baseTime);

            vm.handleDistanceToast(distance);

            expect(vm.inTrackDate).toBe(0);
            expect(vm.showToast).toBe(true);

        });

    });

});