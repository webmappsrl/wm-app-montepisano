angular.module('webmapp')

.controller('MapController', function MapController(
    $ionicModal,
    $rootScope,
    $scope,
    $translate,
    CONFIG,
    MapService,
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
    modalScope.vm.isOldModal = false;

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


    if (!modalScope.vm.isOldModal) {
        modalScope.filters = CONFIG.MAP.filters;
        modalScope.currentTab = Object.keys(modalScope.filters)[0];
        modalScope.tab = {};
        modalScope.subTab = {};
        modalScope.layers = {};
        modalScope.sublayers = {};

        modalScope.switchTab = function(id) {
            if (modalScope.filters[id])
                modalScope.currentTab = id;
            else {
                modalScope.currentTab = Object.keys(modalScope.filters)[0];
            }
        };

        modalScope.toggleSublayerTab = function(id, tabId) {

            if (modalScope.subTab[tabId] !== id) {
                modalScope.subTab[tabId] = id;
            } else {
                modalScope.subTab[tabId] = null;
            }
        };

        modalScope.toggleSublayerCheckBox = function(id) {

            for (var tabIndex in modalScope.filters) {
                var tab = modalScope.filters[tabIndex];
                for (var subIndex in tab.sublayers) {
                    var sub = tab.sublayers[subIndex];
                    if (sub.label === id) {
                        modalScope.sublayers[id] = !modalScope.sublayers[id];
                        for (var index in sub.items) {
                            modalScope.layers[sub.items[index].label] = modalScope.sublayers[id];
                            modalScope.vm.updateFilter(sub.items[index].label, modalScope.sublayers[id]);
                        }
                    }
                }
            }
        }

        modalScope.toggleLayer = function(layerLabel, sublayerId, tabId) {
            modalScope.layers[layerLabel] = !modalScope.layers[layerLabel];
            checkTabState(sublayerId, tabId);
            modalScope.vm.updateFilter(layerLabel, modalScope.layers[layerLabel]);
        };

        var checkTabState = function(sublayerId, tabId) {

            var sublayer = modalScope.filters[tabId].sublayers[sublayerId];
            var sublabel = sublayer.label;
            var state = true;
            for (var index in sublayer.items) {
                var label = sublayer.items[index].label;
                if (!modalScope.layers[label]) {
                    state = false;
                    break;
                }
            }
            modalScope.sublayers[sublabel] = state;
        }

        var checkAllTabsState = function() {

            for (var tabIndex in modalScope.filters) {
                var tab = modalScope.filters[tabIndex];
                for (var sublayerId in tab.sublayers) {
                    var sublayer = modalScope.filters[tabIndex].sublayers[sublayerId];
                    var sublabel = sublayer.label;
                    var state = true;
                    for (var index in sublayer.items) {
                        var label = sublayer.items[index].label;
                        if (!modalScope.layers[label]) {
                            state = false;
                            break;
                        }
                    }
                    modalScope.sublayers[sublabel] = state;
                }
            }
        }
    }


    modalScope.vm.hide = function() {
        modal.hide();
    };

    modalScope.vm.updateFilter = function(filterName, value) {
        if (filterName === "Tutte") {
            for (var i in modalScope.vm.filters) {
                modalScope.vm.filters[i].value = value;
                MapService.setFilter(i, value);
            }
        } else {
            MapService.setFilter(filterName, value);
            modalScope.vm.filters[filterName].value = value;
            modalScope.vm.filters["Tutte"].value = areAllActive(modalScope.vm.filters);
        }
    };

    modalScope.vm.updateBaseMap = function(name) {
        if (modalScope.vm.currentMapLayer === name) {
            return;
        }
        MapService.activateMapLayer(name);
        modalScope.vm.currentMapLayer = name;
    };

    vm.openFilters = function() {

        if (!modalScope.vm.isOldModal) {
            modalScope.layers = MapService.getActiveFilters();
            checkAllTabsState();
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