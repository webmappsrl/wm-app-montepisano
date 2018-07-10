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
        vm.goTo = Utils.goTo;
        vm.taxonomy = {};
        vm.colors = CONFIG.STYLE;
        vm.selectedFilter = '-1';

        for (var i in CONFIG.MENU) {
            if (CONFIG.MENU[i].type === 'trackTaxonomy') {
                vm.title = CONFIG.MENU[i].label;
                break;
            }
        }

        vm.defaultLang = (CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual) ? CONFIG.LANGUAGES.actual.substring(0, 2) : 'it';
        vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";

        vm.goToFilteredTracks = function (id) {
            if (vm.taxonomy[id].filteredCount > 0){
                Utils.goTo('filteredLayer/Tracks/' + id + '/' + ((+vm.selectedFilter !== -1) ? vm.selectedFilter : ""));
            }
        };

        var getCountForTaxonomy = function () {
            var features = MapService.getFeatureIdMap();

            for (var id in vm.taxonomy) {
                vm.taxonomy[id].filteredCount = 0;
            }

            for (var id in features) {
                if (features[id].geometry.type === 'LineString') {
                    if (features[id].properties.taxonomy && features[id].properties.taxonomy.activity) {
                        for (var i in features[id].properties.taxonomy.activity) {
                            if (+vm.selectedFilter !== -1 && features[id].properties.taxonomy.theme) {
                                for (var j in features[id].properties.taxonomy.theme) {
                                    if (+features[id].properties.taxonomy.theme[j] === +vm.selectedFilter) {
                                        vm.taxonomy[features[id].properties.taxonomy.activity[i]].filteredCount++;
                                        break;
                                    }
                                }
                            }
                            else if (+vm.selectedFilter === -1) {
                                vm.taxonomy[features[id].properties.taxonomy.activity[i]].filteredCount++;
                            }
                        }
                    }
                }
            }
            Utils.forceDigest();
        };

        vm.updateCounts = function () {
            getCountForTaxonomy();
        };

        registeredEvents.push(
            $rootScope.$on('taxonomy-activity-updated', function (e, value) {
                $ionicLoading.hide();
                vm.taxonomy = value;

                for (var id in value) {
                    if (!vm.taxonomy[id].color) {
                        vm.taxonomy[id].color = '#0079BF';
                    }
                }

                getCountForTaxonomy();
                Utils.forceDigest();
            })
        );

        registeredEvents.push(
            $rootScope.$on('taxonomy-theme-updated', function (e, value) {
                vm.filter = [];
                for (var id in value) {
                    var name = value[id].name[vm.currentLang] ? value[id].name[vm.currentLang] : (value[id].name[vm.defaultLang] ? value[id].name[vm.defaultLang] : value[id].name[Object.keys(value[id].name)[0]]);
                    vm.filter.push({
                        id: id,
                        name: name,
                        icon: value[id].icon ? value[id].icon : null
                    });
                }

                if (vm.taxonomy) {
                    getCountForTaxonomy();
                }
                Utils.forceDigest();
            })
        );

        var init = function () {
            $ionicLoading.show({
                template: '<ion-spinner></ion-spinner>'
            });
            PackageService.getTaxonomy('activity');
            PackageService.getTaxonomy('theme');
        };

        registeredEvents.push(
            $scope.$on('$ionicView.beforeLeave', function () {
                for (var i in registeredEvents) {
                    registeredEvents[i]();
                }
                delete registeredEvents;
            })
        );

        init();

        return vm;
    });