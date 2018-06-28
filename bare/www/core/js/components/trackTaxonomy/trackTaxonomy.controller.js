angular.module('webmapp')

    .controller('TrackTaxonomyController', function TrackTaxonomyController(
        $ionicLoading,
        $rootScope,
        $scope,
        $translate,
        CONFIG,
        MapService,
        PackageService,
        Utils
    ) {
        var vm = {};

        var registeredEvents = [];

        vm.goBack = Utils.goBack;
        vm.taxonomy = {};
        vm.colors = CONFIG.STYLE;
        vm.selectedFilter = null;

        vm.defaultLang = (CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual) ? CONFIG.LANGUAGES.actual.substring(0, 2) : 'it';
        vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";

        var getCountForTaxonomy = function () {
            var features = MapService.getFeatureIdMap();

            for (var id in features) {
                if (features[id].geometry.type === 'LineString') {
                    for (var i in features[id].properties.activity) {
                        if (!vm.taxonomy.filteredCount) {
                            vm.taxonomy[features[id].properties.activity[i]].filteredCount = 0;
                        }
                        vm.taxonomy[features[id].properties.activity[i]]++;
                    }
                }
            }
            Utils.forceDigest();
        };

        vm.updateCounts = function ($event) {
            getCountForTaxonomy();
        };

        registeredEvents.push(
            $rootScope.$on('taxonomy-activity-updated', function (e, value) {
                $ionicLoading.hide();
                vm.taxonomy = value;

                vm.filter = [];
                for (var id in value) {
                    vm.taxonomy[id].filteredCount = 0;
                    if (!vm.taxonomy[id].color) {
                        vm.taxonomy[id].color = '#0079BF';
                    }
                    var name = value[id].name[vm.currentLang] ? value[id].name[vm.currentLang] : (value[id].name[vm.defaultLang] ? value[id].name[vm.defaultLang] : value[id].name[Object.keys(value[id].name)[0]]);
                    vm.filter.push({
                        id: id,
                        name: name
                    });
                }

                vm.selectedItem = vm.filter[0];
                getCountForTaxonomy();
                Utils.forceDigest();
            })
        );

        registeredEvents.push(
            $scope.$on('$ionicView.enter', function () {
                $ionicLoading.show({
                    template: '<ion-spinner></ion-spinner>'
                });
                PackageService.getTaxonomy('activity');
            })
        );

        registeredEvents.push(
            $scope.$on('$ionicView.beforeLeave', function () {
                for (var i in registeredEvents) {
                    registeredEvents[i]();
                }
                delete registeredEvents;
            })
        );
        
        return vm;
    });