describe('Account.Factory', function() {

    beforeEach(module('webmapp'));

    var mapService;
    var $httpBackend;
    var $q;
    var $rootScope;
    beforeEach(inject(function(MapService, _$httpBackend_, _$q_, _$rootScope_) {
        mapService = MapService;
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
        $q = _$q_;

        $httpBackend.whenGET().respond(404);
        $httpBackend.flush();

        spyOn(L.control, 'scale').and.callFake(function() {
            return { addTo: function() {} };
        });
        spyOn(L.control, 'groupedLayers').and.callFake(function() {
            return { addTo: function() {} };
        });

        spyOn(L.control, 'locate').and.callFake(function() {
            return { addTo: function() {} };
        });
        spyOn(L, 'MarkerClusterGroup').and.callFake(function() {
            return { addTo: function() {}, on: function() {} };
        });

        spyOn(L, 'polyline').and.callFake(function(args) {
            return {
                coords: args,
                addTo: function() { return this },
                addLatLng: function(latLngs) { this.coords = this.coords.concat(latLngs) },
                redraw: function() {}
            };
        });

        spyOn(L, 'map').and.callFake(function() {
            return {
                on: function() {},
                whenReady: function() {},
                addLayer: function(arg) { return this.tmp.push(arg) },
                removeLayer: function(arg) {
                    this.tmp = [];
                },
                tmp: []
            };
        });

        mapService.initialize();

    }));


    it('it should create a polyline', function() {

        var cord = [
            [43.718, 10.4],
            [43.718, 10.41]
        ];

        mapService.createUserPolyline([
            cord
        ]);
        var tmp = mapService.getUserPolyline();

        expect(L.polyline).toHaveBeenCalled();
        expect(tmp.coords).toEqual([cord]);

    });

    it('it should create a polyline and remove previous one ', function() {

        var cord = [
            [43.718, 10.4],
            [43.718, 10.41]
        ];
        var cord1 = [
            [43.718, 10.5],
            [43.718, 10.51]
        ];

        mapService.createUserPolyline([
            cord
        ]);
        var tmp = mapService.getUserPolyline();

        mapService.createUserPolyline([
            cord1
        ]);
        var tmp1 = mapService.getUserPolyline();

        expect(L.polyline).toHaveBeenCalled();
        expect(tmp.coords).not.toEqual(tmp1.coords);
        expect(tmp1.coords).toEqual([cord1]);
    });


    it('it should create a polyline and remove previous one ', function() {

        var cord = [
            [43.718, 10.4],
            [43.718, 10.41]
        ];
        var cord1 = [
            [43.718, 10.5],
            [43.718, 10.51]
        ];

        mapService.createUserPolyline([
            cord
        ]);
        var tmp = mapService.getUserPolyline();

        mapService.createUserPolyline([
            cord1
        ]);
        var tmp1 = mapService.getUserPolyline();

        expect(L.polyline).toHaveBeenCalled();
        expect(tmp.coords).not.toEqual(tmp1.coords);
        expect(tmp1.coords).toEqual([cord1]);
    });

    ;
    it('it should update the current polyline', function() {

        var cord = [
            [43.718, 10.5],
            [43.718, 10.51]
        ];

        mapService.createUserPolyline([
            cord
        ]);

        var updateCord = [43.718, 10.44];
        mapService.updateUserPolyline([
            updateCord
        ]);

        var tmp = mapService.getUserPolyline();
        expect(tmp.coords[tmp.coords.length - 1]).toEqual(updateCord);

    });


    it('it should remove  the current polyline', function() {

        var cord = [
            [43.718, 10.5],
            [43.718, 10.51]
        ];

        mapService.createUserPolyline([
            cord
        ]);

        mapService.removeUserPolyline();

        var tmp = mapService.getUserPolyline();
        expect(tmp).toEqual(null);

    });

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });


});