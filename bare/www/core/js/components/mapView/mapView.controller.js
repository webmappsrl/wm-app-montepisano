angular.module('webmapp')

.controller('MapController', function MapController(
    $scope,
    $rootScope,
    $location,
    $ionicModal,
    MapService,
    CONFIG
) {
    var vm = {};

    var modalScope = $rootScope.$new(),
        modal = {};

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
    
    MapService.showAllLayers();
    MapService.activateUtfGrid();
    modalScope.vm = {};

    vm.mapTitle = CONFIG.OPTIONS.title;
    vm.filterIcon = CONFIG.OPTIONS.filterIcon;
    vm.showFilers = !CONFIG.OPTIONS.hideFiltersInMap;

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
        if (filterName === 'Tutte') {
            for (var i in modalScope.vm.filters) {
                modalScope.vm.filters[i] = value;
                MapService.setFilter(i, value);
            }
        } else {
            MapService.setFilter(filterName, value);
            modalScope.vm.filters[filterName] = value;
            modalScope.vm.filters['Tutte'] = areAllActive(modalScope.vm.filters);
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
        var activeFilters = angular.extend({Tutte: true}, MapService.getActiveFilters()),
            allActive = areAllActive(activeFilters);

        activeFilters['Tutte'] = allActive;
        modalScope.vm.filters = activeFilters;
        modalScope.vm.currentMapLayer = MapService.getCurrentMapLayerName();

        modal.show();
    };

    $scope.$on('$destroy', function() {
        modal.hide();
    });

    return vm;
});