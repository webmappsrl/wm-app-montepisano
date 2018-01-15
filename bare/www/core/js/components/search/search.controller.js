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
    
    modalScope.vm = {};

    vm.showInMap = !options.hideShowInMapFromSearch;
    vm.colors = CONFIG.STYLE;
    vm.results = [];
    vm.goBack = Utils.goBack;

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
    vm.othersCount = String(vm.filtersList.length -1);
    vm.translatedFiltersList = vm.filtersList;

    vm.translateOverlayInArray = function(array) {
        var currentLang = $translate.preferredLanguage();
        var translated = [];
        for (var i in array) {
            var translatedName = "";
            if (array[i].label) {
                translatedName = array[i].label;
            }
            console.log(typeof(array[i]))
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
                }
                else {
                    translated[i] = translatedName;
                }
            }
            else {
                translated[i] = array[i];
            }
        }

        return translated;
    };

    vm.translatedFiltersList = vm.translateOverlayInArray(vm.translatedFiltersList);

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
        vm.filtersList = Search.getActiveLayers();
        vm.translatedFiltersList = vm.translateOverlayInArray(vm.filtersList);
        vm.othersCount = String(vm.filtersList.length -1);
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