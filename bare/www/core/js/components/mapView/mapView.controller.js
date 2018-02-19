angular.module('webmapp')

.controller('MapController', function MapController(
    $scope,
    $rootScope,
    $location,
    $ionicModal,
    MapService,
    CONFIG,
    $translate
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

    vm.mapTitle = CONFIG.OPTIONS.title;
    vm.filterIcon = CONFIG.OPTIONS.filterIcon;
    vm.showFilers = !CONFIG.OPTIONS.hideFiltersInMap;

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

    $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/filtersModal.html', {
        scope: modalScope,
        animation: 'slide-in-up'
    }).then(function(modalObj) {
        modal = modalObj;
    });

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

            if (CONFIG.OVERLAY_LAYERS[i].languages && CONFIG.OVERLAY_LAYERS[i].languages[lang]) {
                nameTranslated = CONFIG.OVERLAY_LAYERS[i].languages[lang];
            }

            activeFilters[CONFIG.OVERLAY_LAYERS[i].label] = {
                name: nameTranslated,
                value: filt[CONFIG.OVERLAY_LAYERS[i].label]
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

    return vm;
});