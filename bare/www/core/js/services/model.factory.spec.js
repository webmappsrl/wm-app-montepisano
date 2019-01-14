describe('Model.Factory', function () {
    var modelService;
    var Search;
    var $httpBackend;
    var $rootScope;
    var CONFIG;
    var Utils;

    var menuLayerGroupLabel = "LayerGroupTest";
    var menuMapLabel = "mapTest";
    var poiLayerLabel = "poiTest";
    var poiLayerLabel1 = "poiTest1";
    var trackLayerLabel = "trackTest";
    var menuPageLabel = "menuPageTest";
    var menuPageGroupLabel = "menuPageGroupLabel";
    var pageLabel = "pageTest";
    var pageLabelType = "pageTestType";
    var poiColor = "poiColor";
    var mapColor = "mapColor";
    var menuPageGroupColor = "menuPageGroupColor";
    var menuLayerGroupColor = "menuLayerGroupColor";

    beforeEach(module('webmapp'));

    beforeEach(function () {
        CONFIG = angular.copy(MOCK_CONFIG);

        CONFIG.OPTIONS = {
            "activateZoomControl": true,
            "mainMenuHideWebmappPage": true,
            "mainMenuHideAttributionPage": true,
            "showAccessibilityButtons": true
        };

        CONFIG.OVERLAY_LAYERS = [
            {
                "id": 1,
                "geojsonUrl": "pois_0.geojson",
                "label": poiLayerLabel,
                "color": poiColor,
                "icon": "wm-icon-siti-interesse",
                "showByDefault": true,
                "type": "poi_geojson",
                "alert": false,
                "languages": {
                    "it": poiLayerLabel,
                    "en": poiLayerLabel
                }
            },
            {
                "id": 3,
                "geojsonUrl": "pois_1.geojson",
                "label": poiLayerLabel1,
                "showByDefault": true,
                "type": "poi_geojson",
                "alert": false,
                "languages": {
                    "it": poiLayerLabel1,
                    "en": poiLayerLabel1
                }
            },
            {
                "id": 2,
                "geojsonUrl": "tracks_2.geojson",
                "label": trackLayerLabel,
                "color": "#dd3333",
                "icon": "wm-icon-trail",
                "showByDefault": false,
                "type": "line_geojson",
                "alert": false,
                "languages": {
                    "it": trackLayerLabel,
                    "en": trackLayerLabel
                }
            }];

        CONFIG.SEARCH = {
            "active": true,
            "indexFields": [
                "name",
                "address"
            ],
            "showAllByDefault": true,
            "stemming": true,
            "removeStopWords": true,
            "indexStrategy": "AllSubstringsIndexStrategy",
            "TFIDFRanking": true
        };

        CONFIG.MENU = [
            {
                "label": menuMapLabel,
                "type": "map",
                "color": mapColor,
                "icon": "wm-icon-generic"
            },
            {
                "label": menuLayerGroupLabel,
                "type": "layerGroup",
                "icon": "wm-icon-generic",
                "items": [
                    poiLayerLabel
                ]
            },
            {
                "label": "menuLayerGroupLabel1",
                "type": "layerGroup",
                "color": menuLayerGroupColor,
                "icon": "wm-icon-generic",
                "items": [
                    poiLayerLabel1
                ]
            },
            {
                "label": menuPageLabel,
                "type": "page"
            },
            {
                "label": menuPageGroupLabel,
                "type": "pageGroup",
                "color": menuPageGroupColor,
                "items": [
                    pageLabel
                ]
            }];

        CONFIG.PAGES = [{
            "label": pageLabel,
            "type": pageLabelType,
            "isCustom": true
        }];

        module(function ($provide) {
            $provide.value('CONFIG', CONFIG);
        });
    });

    beforeEach(inject(function (Model, _$httpBackend_, _$rootScope_, _Search_, _Utils_) {
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
        Utils = _Utils_;
        modelService = Model;
        Search = _Search_;
        $httpBackend.whenGET().respond(404);
    }));

    describe('isLayerInMenu', function () {
        it('it should be defined', function () {
            expect(modelService.isLayerInMenu(menuLayerGroupLabel)).toBeDefined();
            expect(modelService.isLayerInMenu(poiLayerLabel)).toBeDefined();
            $httpBackend.flush();
        });
        it('it should not be defined', function () {
            expect(modelService.isLayerInMenu("test123")).not.toBeDefined();
            expect(modelService.isLayerInMenu(trackLayerLabel)).not.toBeDefined();
            $httpBackend.flush();
        });
    });

    describe('getItemType', function () {
        it('it should be defined', function () {
            expect(modelService.isLayerInMenu(menuLayerGroupLabel)).toBeDefined();
            $httpBackend.flush();
        });

        it('it should not be defined', function () {
            expect(modelService.isLayerInMenu("test123")).not.toBeDefined();
            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('getItemType', function () {
        it('it should be return correct type', function () {
            expect(modelService.getItemType(menuLayerGroupLabel)).toEqual("layerGroup");
            expect(modelService.getItemType(poiLayerLabel)).toEqual("layer");
            expect(modelService.getItemType(pageLabel)).toEqual("page");
            expect(modelService.getItemType(menuPageGroupLabel)).toEqual("pageGroup");
            // expect(modelService.getItemType(menuPageLabel)).toEqual("page");
            $httpBackend.flush();
        });
        it('it should return undefined', function () {
            expect(modelService.getItemType("wrongLabel")).not.toBeDefined();
            expect(modelService.getItemType("wrongLabel")).not.toBeDefined();
            expect(modelService.getItemType("wrongLabel")).not.toBeDefined();
            expect(modelService.getItemType("wrongLabel")).not.toBeDefined();
            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('buildItemUrl', function () {
        it('it should build correct url', function () {
            var separator = '/';
            var item = {};

            expect(modelService.buildItemUrl(item)).toEqual(separator);
            item.label = menuLayerGroupLabel;
            expect(modelService.buildItemUrl(item)).toEqual("layer" + separator + menuLayerGroupLabel);
            item.label = menuPageGroupLabel;
            expect(modelService.buildItemUrl(item)).toEqual("pages" + separator + menuPageGroupLabel);
            item.label = pageLabel;
            expect(modelService.buildItemUrl(item)).toEqual(pageLabelType);
            item.type = "internalLink";
            item.url = "realurl";
            expect(modelService.buildItemUrl(item)).toEqual(item.url);
            item.type = "closeMap";
            expect(modelService.buildItemUrl(item)).toEqual('');
            item.type = "packages";
            expect(modelService.buildItemUrl(item)).toEqual(item.type + separator);
            item.label = "item with spaces";
            item.type = "layerGroup"
            expect(modelService.buildItemUrl(item)).toEqual("layer" + separator + item.label.replace(/ /g, '_'));
            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('addItemToLayer', function () {
        it('it should add item successfully to Model and Search', function () {
            var item = {
                properties: {
                    name: "featureName"
                }
            };
            var layer = {
                label: poiLayerLabel
            }
            spyOn(Search, 'addToIndex').and.returnValue(true);
            modelService.addItemToLayer(item, layer);
            var overlayMap = modelService.getLayersMap();
            var temp = overlayMap[layer.label];
            expect(Search.addToIndex).toHaveBeenCalledWith(item, layer.label);
            expect(temp.items).toContain(item);

            $httpBackend.flush();
        });

        it('it should add item to Model but not to Search', function () {
            var item = {
                properties: {
                    name: "featureName"
                }
            };
            var layer = {
                label: poiLayerLabel,
                skipSearch: true
            }
            spyOn(Search, 'addToIndex').and.returnValue(true);
            modelService.addItemToLayer(item, layer);
            var overlayMap = modelService.getLayersMap();
            var temp = overlayMap[layer.label];
            expect(Search.addToIndex).not.toHaveBeenCalled();
            expect(temp.items).toContain(item);
            $httpBackend.flush();
        });

        it('it should not add item to Model or Search', function () {
            var item = {};
            var layer = {
                label: poiLayerLabel
            }

            spyOn(Search, 'addToIndex').and.returnValue(true);
            modelService.addItemToLayer(item, layer);
            var overlayMap = modelService.getLayersMap();
            var temp = overlayMap[layer.label];
            expect(Search.addToIndex).not.toHaveBeenCalled();
            expect(temp.items).not.toContain(item);

            item = {
                properties: {
                    name: "featureName"
                }
            };
            layer = {
                label: "wrongLabel"
            }

            expect(Search.addToIndex).not.toHaveBeenCalled();
            expect(temp.items).not.toContain(item);

            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('isAChild', function () {
        it('it should return correct values', function () {
            expect(modelService.isAChild(poiLayerLabel)).toBeDefined();
            expect(modelService.isAChild(trackLayerLabel)).not.toBeDefined();
            expect(modelService.isAChild("wrongLabel")).not.toBeDefined();

            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('isAPageChild', function () {
        it('it should return correct values', function () {
            expect(modelService.isAPageChild(pageLabel)).toBeDefined();
            expect(modelService.isAPageChild("wrongLabel")).not.toBeDefined();
            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('isAPageGroup', function () {
        it('it should return correct values', function () {
            expect(modelService.isAPageGroup(menuPageGroupLabel)).toBeDefined();
            expect(modelService.isAPageGroup("wrongLabel")).not.toBeDefined();
            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('isAnOverlayGroup', function () {
        it('it should return correct values', function () {
            expect(modelService.isAnOverlayGroup(menuLayerGroupLabel)).toBeDefined();
            expect(modelService.isAnOverlayGroup("wrongLabel")).not.toBeDefined();
            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('getListColor', function () {
        it("it should return the rigth color", function () {
            expect(modelService.getListColor(menuMapLabel)).toEqual(mapColor);

            CONFIG.MAIN = { STYLE: { menu: { color: "someColor" } } }
            expect(modelService.getListColor(menuPageLabel)).toEqual("someColor");
            delete CONFIG.MAIN;

            CONFIG.STYLE.menu.color = "anotherColor";
            expect(modelService.getListColor(menuLayerGroupLabel)).toEqual("anotherColor");

            expect(modelService.getListColor(poiLayerLabel)).toEqual(poiColor);
            expect(modelService.getListColor(poiLayerLabel1)).toEqual(menuLayerGroupColor);

            CONFIG.STYLE.global.color = "globalColor";
            expect(modelService.getListColor("unknown")).toEqual("globalColor");

            expect(modelService.getListColor(pageLabel)).toEqual(menuPageGroupColor);

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
});
