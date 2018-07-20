describe('Model.Factory', function() {



    beforeEach(module('webmapp'));

    var modelService;
    var Search;
    var $httpBackend;
    var $rootScope;
    var config;
    var Utils;

    var menuLayerGroupLabel = "LayerGroupTest";
    var menuMapLabel = "mapTest";
    var poiLayerLabel = "poiTest";
    var trackLayerLabel = "trackTest";
    var menuPageLabel = "menuPageTest";
    var menuPageGroupLabel = "menuPageGroupLabel";
    var pageLabel = "pageTest";
    var pageLabelType = "pageTestType";

    //set fake CONFIG before inject the provider
    beforeEach(inject(function(_CONFIG_) {
        config = _CONFIG_;

        config.OPTIONS = {
            "title": "CONFIGTEST",
            "startUrl": "/",
            "useLocalStorageCaching": false,
            "advancedDebug": false,
            "hideHowToReach": true,
            "hideMenuButton": false,
            "hideExpanderInDetails": false,
            "hideFiltersInMap": false,
            "hideDeactiveCentralPointer": false,
            "hideShowInMapFromSearch": true,
            "avoidModalInDetails": true,
            "useAlmostOver": false,
            "filterIcon": "wm-icon-layers",
            "activateZoomControl": true,
            "mainMenuHideWebmappPage": true,
            "mainMenuHideAttributionPage": true,
            "showAccessibilityButtons": true
        };

        if (config.OVERLAY_LAYERS) {
            config.OVERLAY_LAYERS = [{
                    "id": 1,
                    "geojsonUrl": "pois_1.geojson",
                    "label": poiLayerLabel,
                    "color": "#00ff00",
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
                }
            ];
        }

        if (config.MENU) {
            config.MENU = [{
                    "label": menuMapLabel,
                    "type": "map",
                    "color": "#486C2C",
                    "icon": "wm-icon-generic"
                },
                {
                    "label": menuLayerGroupLabel,
                    "type": "layerGroup",
                    "color": "#E79E19",
                    "icon": "wm-icon-generic",
                    "items": [
                        poiLayerLabel
                    ]
                },
                {
                    "label": menuPageLabel,
                    "type": "page"
                },
                {
                    "label": menuPageGroupLabel,
                    "type": "pageGroup",
                    "items": [
                        pageLabel
                    ]
                }
            ];
        }

        if (config.PAGES) {
            config.PAGES = [{
                "label": pageLabel,
                "type": pageLabelType,
                "isCustom": true
            }];
        }


        if (config.LANGUAGES)
            delete config.LANGUAGES;
        if (config.OFFLINE)
            delete config.OFFLINE;
        if (config.REPORT)
            delete config.REPORT;
        if (config.OPTIONS)
            delete config.OPTIONS;
        if (config.SHARE)
            delete config.SHARE;
        if (config.COMMUNICATION)
            delete config.COMMUNICATION;
        if (config.MAP)
            delete config.MAP;
        if (config.DETAIL_MAPPING)
            delete config.DETAIL_MAPPING;

        // console.log(config);
    }));

    beforeEach(inject(function(Model, _$httpBackend_, _$rootScope_, _Search_, _Utils_) {
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
        Utils = _Utils_;
        modelService = Model
        Search = _Search_;
        $httpBackend.whenGET().respond(404);
    }));


    describe('isLayerInMenu', function() {
        it('it should be defined', function() {
            expect(modelService.isLayerInMenu(menuLayerGroupLabel)).toBeDefined();
            expect(modelService.isLayerInMenu(poiLayerLabel)).toBeDefined();
            $httpBackend.flush();
        });
        it('it should not be defined', function() {
            expect(modelService.isLayerInMenu("test123")).not.toBeDefined();
            expect(modelService.isLayerInMenu(trackLayerLabel)).not.toBeDefined();
            $httpBackend.flush();
        });
    })

    describe('getItemType', function() {
        it('it should be defined', function() {
            expect(modelService.isLayerInMenu(menuLayerGroupLabel)).toBeDefined();
            $httpBackend.flush();
        });
        it('it should not be defined', function() {
            expect(modelService.isLayerInMenu("test123")).not.toBeDefined();
            $httpBackend.flush();
        });
        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    })


    describe('getItemType', function() {
        it('it should be return correct type', function() {
            expect(modelService.getItemType(menuLayerGroupLabel)).toEqual("layerGroup");
            expect(modelService.getItemType(poiLayerLabel)).toEqual("layer");
            expect(modelService.getItemType(pageLabel)).toEqual("page");
            expect(modelService.getItemType(menuPageGroupLabel)).toEqual("pageGroup");
            // expect(modelService.getItemType(menuPageLabel)).toEqual("page");
            $httpBackend.flush();
        });
        it('it should return undefined', function() {
            expect(modelService.getItemType("wrongLabel")).not.toBeDefined();
            expect(modelService.getItemType("wrongLabel")).not.toBeDefined();
            expect(modelService.getItemType("wrongLabel")).not.toBeDefined();
            expect(modelService.getItemType("wrongLabel")).not.toBeDefined();
            $httpBackend.flush();
        });
        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

    })

    describe('buildItemUrl', function() {
        it('it should build correct url', function() {

            var separator = '/';
            var item = {
                label: menuLayerGroupLabel
            };
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
        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

    });


    describe('addItemToLayer', function() {


        it('it should add item successfully to Model and Search', function() {
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

        it('it should add item to Model but not to Search', function() {
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

        })

        it('it should not add item to Model or Search', function() {
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

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });
});