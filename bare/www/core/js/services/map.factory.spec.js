describe('Map.Factory', function () {
    var mapService;
    var $httpBackend;
    var $q;
    var $ionicLoading;
    var CONFIG;
    var spy = {};

    beforeEach(module('webmapp'));

    beforeEach(function () {
        CONFIG = angular.copy(MOCK_CONFIG);

        module(function ($provide) {
            $provide.value('CONFIG', CONFIG);
        });
    });

    beforeEach(inject(function (MapService, _$httpBackend_, _$q_, _$ionicLoading_) {
        mapService = MapService;
        $httpBackend = _$httpBackend_;
        $q = _$q_;
        $ionicLoading = _$ionicLoading_;

        $httpBackend.whenGET().respond(404);
        $httpBackend.flush();

        spyOn(L.control, 'scale').and.callFake(function () {
            return { addTo: function () { } };
        });
        spyOn(L.control, 'groupedLayers').and.callFake(function () {
            return { addTo: function () { } };
        });
        spyOn(L.control, 'locate').and.callFake(function () {
            return { addTo: function () { } };
        });
        spyOn(L.control, 'zoom').and.callFake(function () {
            return { addTo: function () { } };
        });
        spyOn(L.control, 'elevation').and.callFake(function ({ options }) {
            return { addTo: function () { } };
        });
        spyOn(L, 'MarkerClusterGroup').and.callFake(function () {
            return { addTo: function () { }, on: function () { } };
        });
        spyOn(L, 'polyline').and.callFake(function (args) {
            return {
                coords: args,
                addTo: function () { return this },
                addLatLng: function (latLngs) { this.coords = this.coords.concat(latLngs) },
                redraw: function () { }
            };
        });
        spy['map'] = spyOn(L, 'map').and.callFake(function () {
            return {
                on: function () { },
                whenReady: function () { },
                addLayer: function (arg) { return this.tmp.push(arg) },
                removeLayer: function (arg) {
                    this.tmp = [];
                },
                tmp: []
            };
        });
    }));

    describe('initialize', function () {
        xit('should not initialize twice', function () {
            var calls = spy['map'].calls.count();
            mapService.initialize();
            expect(spy['map']).toHaveBeenCalledTimes(calls);
        });

        xit('should call $.getGeoJSON at least once for every geojson', function () {
            CONFIG.OVERLAY_LAYERS = [
                {
                    "id": 30,
                    "geojsonUrl": "pois_30.geojson",
                    "label": "Bar",
                    "color": "#00ff00",
                    "icon": "wm-icon-siti-interesse",
                    "showByDefault": true,
                    "type": "poi_geojson",
                    "alert": false,
                    "languages": {
                        "it": "Bar",
                        "en": "bar"
                    }
                },
                {
                    "id": 12,
                    "geojsonUrl": "tracks_12.geojson",
                    "label": "Cicloescursionismo",
                    "color": "#FF3812",
                    "icon": "wm-icon-generic",
                    "showByDefault": true,
                    "type": "line_geojson",
                    "alert": false,
                    "languages": {
                        "it": "Cicloescursionismo",
                        "en": "Mountain bike"
                    }
                }];
            CONFIG.LANGUAGES = {};

            var geojsonSpy = spyOn($, 'getJSON');
            expect(geojsonSpy).toHaveBeenCalledWith([true])
        });

        describe('with no map layers', function () {
            beforeEach(function () {
                CONFIG.MAP.layers = [];
            });
            it('should not initialize if no map layers are set', function () {
                expect(mapService.hasMap()).toBeFalsy();
            });
        });
    });

    describe('userPolyline', function () {
        beforeEach(function () {
            spyOn(mapService, 'hasMap').and.callFake(function () {
                return true;
            });
        });

        it('it should create a polyline', function () {
            var coord = [
                [43.718, 10.4],
                [43.718, 10.41]
            ];

            mapService.createUserPolyline([
                coord
            ]);
            var tmp = mapService.getUserPolyline();

            expect(L.polyline).toHaveBeenCalled();
            expect(tmp.coords).toEqual([coord]);
        });

        it('it should create a polyline and remove previous one', function () {
            var mapReady = function () {
                if (mapService.isReady()) {
                    var coord = [
                        [43.718, 10.4],
                        [43.718, 10.41]
                    ];
                    var coord1 = [
                        [43.718, 10.5],
                        [43.718, 10.51]
                    ];

                    mapService.createUserPolyline([
                        coord
                    ]);
                    var tmp = mapService.getUserPolyline();

                    expect(L.polyline).toHaveBeenCalled();
                    expect(tmp.coords).toEqual([coord]);

                    mapService.createUserPolyline([
                        coord1
                    ]);
                    var tmp1 = mapService.getUserPolyline();

                    expect(L.polyline).toHaveBeenCalled();
                    expect(tmp.coords).not.toEqual(tmp1.coords);
                    expect(tmp1.coords).toEqual([coord1]);
                }
                else {
                    setTimeout(mapReady, 100);
                }
            };

            mapReady();
        });

        it('it should update the current polyline', function () {
            var coord = [
                [43.718, 10.5],
                [43.718, 10.51]
            ];

            mapService.createUserPolyline([
                coord
            ]);

            var updateCoord = [43.718, 10.44];
            mapService.updateUserPolyline([
                updateCoord
            ]);

            var tmp = mapService.getUserPolyline();
            expect(tmp.coords[tmp.coords.length - 1]).toEqual(updateCoord);
        });

        it('it should remove the current polyline', function () {
            var mapReady = function () {
                if (mapService.isReady()) {
                    var coord = [
                        [43.718, 10.5],
                        [43.718, 10.51]
                    ];

                    mapService.createUserPolyline([
                        coord
                    ]);

                    mapService.removeUserPolyline();

                    var tmp = mapService.getUserPolyline();
                    expect(tmp).toEqual(null);
                }
                else {
                    setTimeout(mapReady, 100);
                }
            };

            mapReady();
        });
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });
});
