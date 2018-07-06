angular.module('webmapp')

.controller('MapController', function MapController(
    $ionicModal,
    $rootScope,
    $scope,
    $translate,
    CONFIG,
    MapService,
    Search,
    Utils
) {
    var vm = {};

    var modalScope = $rootScope.$new(),
        modal = {};

    var areAllActive = function(filtersMap) {
        var allActive = true;

        for (var i in filtersMap) {
            if (i !== $translate.instant("Tutte")) {
                if (!filtersMap[i].value) {
                    allActive = false;
                    break;
                }
            }
        }

        return allActive;
    };



    MapService.showAllLayers();
    MapService.activateUtfGrid();
    modalScope.vm = {};
    modalScope.vm.isNewModal = CONFIG.MAP.filters ? true : false;

    vm.mapTitle = CONFIG.OPTIONS.title;
    vm.filterIcon = CONFIG.OPTIONS.filterIcon;
    vm.showFilers = !CONFIG.OPTIONS.hideFiltersInMap;
    vm.isNavigable = $rootScope.isNavigable ? $rootScope.isNavigable : false;
    vm.goBack = Utils.goBack;

    vm.colors = CONFIG.MAIN ? CONFIG.MAIN.STYLE : CONFIG.STYLE;

    vm.packages = localStorage.$wm_packages ? JSON.parse(localStorage.$wm_packages) : null;
    vm.id = CONFIG.routeID;
    var currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";

    if (vm.packages && vm.id) {
        for (var i in vm.packages) {
            if (vm.packages[i].id === vm.id) {
                if (vm.packages[i].wpml_translations) {
                    for (var pos in vm.packages[i].wpml_translations) {
                        if (vm.packages[i].wpml_translations[pos].locale.substring(0, 2) === currentLang) {
                            vm.mapTitle = vm.packages[i].wpml_translations[pos].post_title;
                            break;
                        }
                    }
                }
                break;
            }
        }
    }

    vm.mapLayers = CONFIG.MAP.layers;

    if (vm.mapLayers.length > 1) {
        modalScope.vm.isMap = true;
    } else {
        modalScope.vm.isMap = false;
    }

    modalScope.vm.baseLayers = MapService.getBaseLayers();
    modalScope.vm.COLORS = vm.colors;

    $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/filtersModal.html', {
        scope: modalScope,
        animation: 'slide-in-up'
    }).then(function(modalObj) {
        modal = modalObj;
    });


    if (modalScope.vm.isNewModal) {

        modalScope.filters = angular.copy(CONFIG.MAP.filters);

        modalScope.layers = {};
        modalScope.tabNum = 0;
        for (var tabIndex in modalScope.filters) {

            if (!modalScope.filters[tabIndex].sublayers) {
                delete modalScope.filters[tabIndex];
            } else {
                modalScope.tabNum += 1;
                if (tabIndex === 'pois') {
                    modalScope.filters[tabIndex].label = "Punti";
                } else if (tabIndex === 'tracks') {
                    modalScope.filters[tabIndex].label = "Traccie";
                } else {
                    modalScope.filters[tabIndex].label = "Mappe";
                }
                var subTabs = modalScope.filters[tabIndex].sublayers;
                modalScope.filters[tabIndex].selectedTab = -1;
                for (var subTabIndex in subTabs) {
                    var subTab = subTabs[subTabIndex];
                    subTab.checked = false;
                    if (subTab.label === "custom") {
                        subTab.label = "altri";
                    }
                    var tmp = [];
                    for (var index in subTab.items) {
                        var layerId = subTab.items[index];
                        var layer = MapService.getOverlayLayerById(layerId);
                        if (layer) {
                            var info = { id: layerId, label: layer.label, checked: false };
                            if (info.id === "1" || info.id === "2" || info.id === "3" || info.id === "4") {
                                info.checked = true;
                            }
                            tmp.push(info);
                            modalScope.layers[layer.label] = info;
                        }
                    }
                    subTab.items = tmp;
                }
            }
        }

        modalScope.currentTab = Object.keys(modalScope.filters)[0];

        modalScope.switchTab = function(id) {
            if (modalScope.filters[id])
                modalScope.currentTab = id;
            else {
                modalScope.currentTab = Object.keys(modalScope.filters)[0];
            }
        };

        modalScope.toggleSubTab = function(id, tabId) {

            if (modalScope.filters[tabId].selectedTab !== id) {
                modalScope.filters[tabId].selectedTab = id;
            } else {
                modalScope.filters[tabId].selectedTab = null;
            }
        };

        modalScope.toggleSubTabCheckBox = function(id, tabId) {

            if (modalScope.filters[tabId] && modalScope.filters[tabId].sublayers[id]) {
                if (modalScope.filters[tabId].sublayers[id].checked) {

                    var items = modalScope.filters[tabId].sublayers[id].items;
                    for (var index in items) {
                        if (items[index].checked) {
                            modalScope.vm.updateFilter(items[index].label, false);
                            items[index].checked = !items[index].checked;
                        }
                    }
                } else {
                    var items = modalScope.filters[tabId].sublayers[id].items;
                    for (var index in items) {
                        if (!items[index].checked) {
                            modalScope.vm.updateFilter(items[index].label, true);
                            items[index].checked = !items[index].checked;
                        }
                    }
                }
                modalScope.filters[tabId].sublayers[id].checked = !modalScope.filters[tabId].sublayers[id].checked;
            }
        }

        modalScope.toggleLayer = function(layerLabel, sublayerId, tabId) {
            modalScope.layers[layerLabel].checked = !modalScope.layers[layerLabel].checked;
            checkTabState(sublayerId, tabId);
            modalScope.vm.updateFilter(layerLabel, modalScope.layers[layerLabel].checked);

        };

        var checkTabState = function(sublayerId, tabId) {

            var state = true;
            var sublayer = modalScope.filters[tabId].sublayers[sublayerId];
            for (var index in sublayer.items) {
                var layerChecked = sublayer.items[index].checked;
                if (!layerChecked) {
                    state = false;
                    break;
                }
            }
            sublayer.checked = state;
        }

        var checkAllTabsState = function() {

            for (var tabId in modalScope.filters) {
                var tab = modalScope.filters[tabId];
                for (var sublayerId in tab.sublayers) {
                    checkTabState(sublayerId, tabId);
                }
            }
        }


        var getFiltersMap = function() {


            var result = [];

            for (var tabIndex in modalScope.filters) {

                if (tabIndex !== "base_maps") {

                    var tab = modalScope.filters[tabIndex];
                    for (var subIndex in tab.sublayers) {

                        var sublayer = tab.sublayers[subIndex];
                        if (sublayer.label === "altri") {
                            for (var layerId in sublayer.items) {
                                if (sublayer.items[layerId].checked) {
                                    result.push([sublayer.items[layerId].id]);
                                }
                            }
                        } else {
                            var filterOR = [];
                            for (var layerId in sublayer.items) {
                                if (sublayer.items[layerId].checked) {
                                    filterOR.push(sublayer.items[layerId].id);
                                }
                            }
                            if (filterOR.length) {
                                result.push(filterOR);
                            }
                        }

                    }
                }
            }

            return result;
        }

    }


    modalScope.vm.hide = function() {
        modal.hide();
    };

    modalScope.vm.updateFilter = function(filterName, value) {
        if (filterName === "Tutte") {
            for (var i in modalScope.vm.filters) {
                modalScope.vm.filters[i].value = value;
                // MapService.setFilter(i, value);
            }
        } else {
            // MapService.setFilter(filterName, value);


            // modalScope.vm.filters[filterName].value = value;
            // modalScope.vm.filters["Tutte"].value = areAllActive(modalScope.vm.filters);
        }
        var ids = filtersSearchFun(getFiltersMap(), true);

        var result = Search.getLayersFilteredByIds(ids);
        MapService.addFeaturesToFilteredLayer(result);
    };
    var featuresIdByLayer = MapService.getFeaturesIdByLayersMap();
    var filtersSearchFun = function(binds, type) {


        var result = [];


        var filter = typeof binds !== "undefined" ? binds : [];

        for (let i = 0; i < filter.length; i++) {

            var arrayOR = [];
            for (let j = 0; j < filter[i].length; j++) {
                var layerId = filter[i][j];


                var lay = MapService.getOverlayLayerById(layerId);
                arrayOR = arrayOR.concat(featuresIdByLayer[lay.label]);
            }

            if (type) {
                if (result.length === 0 && i === 0) {
                    result = arrayOR;
                } else {
                    result = result.concat(arrayOR);
                }
            } else {
                if (result.length === 0 && i == 0) {
                    result = arrayOR;
                } else {
                    result = result.filter(function(n) {
                        return arrayOR.indexOf(n) > -1;
                    });
                }
            }
        }

        return result;
    }

    modalScope.vm.updateBaseMap = function(name) {
        if (modalScope.vm.currentMapLayer === name) {
            return;
        }
        MapService.activateMapLayer(name);
        modalScope.vm.currentMapLayer = name;
    };

    vm.openFilters = function() {

        modalScope.vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";
        modalScope.vm.defaultLang = (CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual) ? CONFIG.LANGUAGES.actual.substring(0, 2) : 'it';

        // for (var i in modalScope.vm.filters) {
        //     MapService.setFilter(i, false);
        // }
        if (modalScope.vm.isNewModal) {
            // var activeFilters = MapService.getActiveFilters();
            // for (layerId in activeFilters) {
            //     if (modalScope.layers[layerId]) {
            //         modalScope.layers[layerId].checked = activeFilters[layerId];
            //     }
            // }
            checkAllTabsState();
            var ids = filtersSearchFun(getFiltersMap(), true);
            MapService.addFeaturesToFilteredLayer(Search.getLayersFilteredByIds(ids));
        }

        var filt = MapService.getActiveFilters(),
            lang = $translate.preferredLanguage(),
            tmp = {},
            allActive = false,
            activeFilters = {};

        tmp["Tutte"] = {
            name: $translate.instant("Tutte"),
            value: true
        };

        for (var i in CONFIG.OVERLAY_LAYERS) {
            var nameTranslated = CONFIG.OVERLAY_LAYERS[i].label;

            if (nameTranslated.toLowerCase() === 'tappe' || nameTranslated.toLowerCase() === 'stages') {
                nameTranslated = $translate.instant('Tappe');
            } else if (CONFIG.OVERLAY_LAYERS[i].languages && CONFIG.OVERLAY_LAYERS[i].languages[lang]) {
                nameTranslated = CONFIG.OVERLAY_LAYERS[i].languages[lang];
            }

            activeFilters[CONFIG.OVERLAY_LAYERS[i].label] = {
                name: nameTranslated,
                value: filt[CONFIG.OVERLAY_LAYERS[i].label],
                icon: CONFIG.OVERLAY_LAYERS[i].icon,
                color: CONFIG.OVERLAY_LAYERS[i].color
            };
        }

        activeFilters = angular.extend(tmp, activeFilters);
        allActive = areAllActive(activeFilters);

        activeFilters["Tutte"].value = allActive;
        modalScope.vm.filters = activeFilters;
        modalScope.vm.currentMapLayer = MapService.getCurrentMapLayerName();

        modal.show();
    };

    $scope.$on('$destroy', function() {
        modal.hide();
    });

    $rootScope.$on('item-navigable', function(e, value) {
        vm.isNavigable = value;
        Utils.forceDigest();
    });

    return vm;
});