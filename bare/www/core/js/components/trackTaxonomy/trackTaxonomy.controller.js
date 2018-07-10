angular.module('webmapp')

    .controller('TrackTaxonomyController', function TrackTaxonomyController(
        $ionicLoading,
        $ionicModal,
        $rootScope,
        $scope,
        $translate,
        CONFIG,
        MapService,
        PackageService,
        Utils
    ) {
        var vm = {};

        var registeredEvents = [],
            modalScope = $rootScope.$new(),
            modal = {};

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

        modalScope.vm = {};
        modalScope.vm.selectedFilter = null;
        modalScope.vm.items = [];

        $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/taxonomyRadioModal.html', {
            scope: modalScope,
            animation: 'slide-in-up'
        }).then(function (modalObj) {
            modal = modalObj;
        });

        modalScope.vm.hide = function () {
            getCountForTaxonomy();
            modal && modal.hide();
        };

        modalScope.vm.selectFilter = function (filter) {
            modalScope.vm.selectedFilter = filter;
            vm.selectedFilter = filter;
            Utils.forceDigest();
        };

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
                            if (+vm.selectedFilter.id !== -1 && features[id].properties.taxonomy.theme) {
                                for (var j in features[id].properties.taxonomy.theme) {
                                    if (+features[id].properties.taxonomy.theme[j] === +vm.selectedFilter.id) {
                                        vm.taxonomy[features[id].properties.taxonomy.activity[i]].filteredCount++;
                                        break;
                                    }
                                }
                            }
                            else if (+vm.selectedFilter.id === -1) {
                                vm.taxonomy[features[id].properties.taxonomy.activity[i]].filteredCount++;
                            }
                        }
                    }
                }
            }
            Utils.forceDigest();
        };

        vm.showTaxonomyRadioModal = function () {
            modal.show();
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
                modalScope.vm.items = [];
                modalScope.vm.items.push({
                    id: '-1',
                    name: $translate.instant("Seleziona la durata"),
                    icon: null
                });
                modalScope.vm.selectedFilter = modalScope.vm.items[0];
                vm.selectedFilter = modalScope.vm.selectedFilter;
                for (var id in value) {
                    var name = value[id].name[vm.currentLang] ? value[id].name[vm.currentLang] : (value[id].name[vm.defaultLang] ? value[id].name[vm.defaultLang] : value[id].name[Object.keys(value[id].name)[0]]);
                    modalScope.vm.items.push({
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