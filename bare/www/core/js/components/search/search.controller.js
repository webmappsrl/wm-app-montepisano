/*global angular*/

angular.module('webmapp')

.controller('SearchController', function SearchController(
    Search,
    MapService,
    Utils,
    $ionicModal,
    $ionicScrollDelegate,
    $rootScope,
    CONFIG
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
            if (i !== 'Tutte') {
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


    modalScope.vm.updateFilter = function(filterName, value) {
        var activeFilters = angular.extend([], Search.getActiveLayersMap()),
            toUpdate = [];

        activeFilters[filterName] = value;

        for (var i in activeFilters) {
            if (activeFilters[i]) {
                toUpdate.push(i);
            }
        }

        Search.setActiveLayers(toUpdate);
        vm.filtersList = Search.getActiveLayers();
        vm.othersCount = String(vm.filtersList.length -1);
        vm.areAllActive = modalScope.vm.areAllActive = areAllActive(Search.getActiveLayersMap());
        vm.results = Search.getByLayersWithDivider(lastQuery, vm.filtersList);
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
        modalScope.vm.areAllActive = vm.areAllActive;
        modalScope.vm.filters = Search.getActiveLayersMap();
        // modalScope.vm.filters['Tutte'] = vm.areAllActive;
        modal.show();
    };
    
    vm.goTo = function(path, isDivider) {
        if (isDivider) {
            return;
        }

        Utils.goTo(path);
    };

    vm.updateSearch = function(query) {
        vm.results = Search.getByLayersWithDivider(query, Search.getActiveLayers());
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