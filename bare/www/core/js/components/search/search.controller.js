/*global angular*/

angular.module('webmapp')

.controller('SearchController', function SearchController(
    Search,
    MapService,
    Utils,
    $ionicModal,
    $ionicScrollDelegate,
    $rootScope,
    CONFIG,
    $translate
) {
    var vm = {};

    var modalScope = $rootScope.$new(),
        modal = {},
        lastQuery;

    var options = CONFIG.OPTIONS;
    var currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";

    modalScope.vm = {};

    // vm.showInMap = !options.hideShowInMapFromSearch;
    vm.showInMap = true;
    vm.colors = CONFIG.MAIN ? CONFIG.MAIN.STYLE : CONFIG.STYLE;
    vm.results = [];
    vm.goBack = Utils.goBack;

    modalScope.vm.COLORS = vm.colors;

    vm.isMapView = false;

    setTimeout(function() {
        MapService.resetView();
        vm.searchReady = true;
    }, 100);

    $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/filtersModal.html', {
        scope: modalScope,
        animation: 'slide-in-up'
    }).then(function(modalObj) {
        modal = modalObj;
    });

    var areAllActive = function(filtersMap) {
        var allActive = true;

        for (var i in filtersMap) {
            if (i !== $translate.instant("Tutte")) {
                if (!filtersMap[i]) {
                    allActive = false;
                    break;
                }
            }
        }

        return allActive;
    };

    vm.areAllActive = areAllActive(Search.getActiveLayersMap());
    vm.filtersList = Search.getActiveLayers();
    vm.othersCount = String(vm.filtersList.length - 1);
    vm.translatedFiltersList = vm.filtersList;

    vm.translateOverlayInArray = function(array) {
        var translated = [];
        for (var i in array) {
            var translatedName = "";
            if (array[i].label) {
                translatedName = array[i].label;
            }
            if (typeof(array[i]) === "string") {
                translatedName = array[i];
            }

            if (translatedName !== "") {
                for (var pos in CONFIG.OVERLAY_LAYERS) {
                    if (CONFIG.OVERLAY_LAYERS[pos].label === translatedName &&
                        CONFIG.OVERLAY_LAYERS[pos].languages &&
                        CONFIG.OVERLAY_LAYERS[pos].languages[currentLang]) {
                        translatedName = CONFIG.OVERLAY_LAYERS[pos].languages[currentLang];
                    }
                }

                if (array[i].label) {
                    translated[i] = array[i];
                    translated[i].label = translatedName;
                } else {
                    translated[i] = translatedName;
                }
            } else {
                translated[i] = array[i];
            }
        }

        return translated;
    };

    vm.translatedFiltersList = vm.translateOverlayInArray(vm.translatedFiltersList);

    modalScope.vm.isNewModal = true;

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
                                    result.push([sublayer.items[layerId].label]);
                                }
                            }
                        } else {
                            var filterOR = [];
                            for (var layerId in sublayer.items) {
                                if (sublayer.items[layerId].checked) {
                                    filterOR.push(sublayer.items[layerId].label);
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

    var featuresIdArray = MapService.getFeaturesIdByLayersMap();

    modalScope.vm.updateFilter = function(filterName, value) {

        var activeFilters = modalScope.vm.filters,
            toUpdate = [];

        activeFilters[filterName].value = value;

        for (var i in activeFilters) {
            if (activeFilters[i].value) {
                toUpdate.push(i);
            }
        }


        Search.setActiveLayers(toUpdate);
        Search.setFacetedFilters(getFiltersMap(), featuresIdArray);
        vm.filtersList = Search.getActiveLayers();
        vm.translatedFiltersList = vm.translateOverlayInArray(vm.filtersList);
        vm.othersCount = String(vm.filtersList.length - 1);
        vm.areAllActive = modalScope.vm.areAllActive = areAllActive(Search.getActiveLayersMap());
        vm.results = vm.translateOverlayInArray(Search.getByLayersWithDivider(lastQuery, vm.filtersList));
        MapService.addFeaturesToFilteredLayer(Search.getByLayersGroupedByLayer(lastQuery, vm.filtersList));

        $ionicScrollDelegate.scrollTop();
    };

    modalScope.vm.hide = function() {
        modal.hide();
    };

    vm.closeKeyboard = function() {
        cordova && cordova.plugins.Keyboard.close();
    };

    vm.openFilters = function() {

        if (modalScope.vm.isNewModal) {
            var activeFilters = Search.getActiveLayersMap();
            for (layerId in activeFilters) {
                if (modalScope.layers[layerId]) {
                    modalScope.layers[layerId].checked = activeFilters[layerId];
                }
            }
            checkAllTabsState();
        }

        var filt = Search.getActiveLayersMap(),
            lang = $translate.preferredLanguage(),
            tmp = {},
            allActive = false,
            activeFilters = {};

        for (var i in CONFIG.OVERLAY_LAYERS) {
            var nameTranslated = CONFIG.OVERLAY_LAYERS[i].label;

            if (CONFIG.OVERLAY_LAYERS[i].languages && CONFIG.OVERLAY_LAYERS[i].languages[lang]) {
                nameTranslated = CONFIG.OVERLAY_LAYERS[i].languages[lang];
            }

            activeFilters[CONFIG.OVERLAY_LAYERS[i].label] = {
                name: nameTranslated,
                value: filt[CONFIG.OVERLAY_LAYERS[i].label]
            };
        }

        // activeFilters = angular.extend(tmp, activeFilters);
        allActive = areAllActive(activeFilters);

        // activeFilters["Tutte"].value = allActive;
        modalScope.vm.filters = activeFilters;

        modalScope.vm.areAllActive = allActive;
        modal.show();
    };

    vm.goTo = function(path, isDivider) {
        if (isDivider) {
            return;
        }

        Utils.goTo(path);
    };

    vm.updateSearch = function(query) {

        vm.results = vm.translateOverlayInArray(Search.getByLayersWithDivider(query, Search.getActiveLayers()));
        vm.results.realLength = 0;

        for (var i in vm.results) {
            if (vm.results[i].id) {
                vm.results.realLength = vm.results.realLength + 1;
            }
        }

        MapService.addFeaturesToFilteredLayer(Search.getByLayersGroupedByLayer(query, Search.getActiveLayers()));
        $ionicScrollDelegate.scrollTop();
        lastQuery = query;
    };

    vm.toggleMap = function() {
        vm.isMapView = !vm.isMapView;
        $rootScope.$emit('toggle-map-in-search', vm.isMapView);
    };

    setTimeout(function() {
        vm.updateSearch();
    }, 10);

    return vm;
});