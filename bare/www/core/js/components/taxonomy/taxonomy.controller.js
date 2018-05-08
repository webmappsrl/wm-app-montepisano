angular.module('webmapp')

    .controller('TaxonomyController', function TaxonomyController(
        $rootScope,
        $ionicLoading,
        $state,
        $translate,
        PackageService,
        Utils,
        CONFIG
    ) {
        var vm = {};

        vm.title = CONFIG.OPTIONS.title;
        var communicationConf = CONFIG.COMMUNICATION;

        vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";
        vm.defaultLang = CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual ? CONFIG.LANGUAGES.actual : 'it';
        vm.taxonomy = null;
        vm.search = "";
        vm.searchActive = false;
        vm.packages = null;
        vm.activity = null;

        var setActivityIcons = function () {
            if (vm.activity && vm.packages && vm.taxonomy) {
                $ionicLoading.hide();
                Utils.forceDigest();
                var icons = [];
                for (var taxId in vm.taxonomy) {
                    icons = [];
                    for (var packId in vm.packages) {
                        for (var pos in vm.packages[packId][$state.params.id]) {
                            if (vm.packages[packId][$state.params.id][pos] === taxId * 1) {
                                for (var i in vm.packages[packId].activity) {
                                    var present = false;
                                    for (var j in icons) {
                                        if (icons[j] === vm.activity[vm.packages[packId].activity[i]].icon) {
                                            present = true;
                                            break;
                                        }
                                    }
                                    if (!present) {
                                        icons.push(vm.activity[vm.packages[packId].activity[i]].icon);
                                    }
                                }
                                break;
                            }
                        }
                    }
                    vm.taxonomy[taxId].icons = angular.copy(icons);
                }
            }
        };

        vm.goToTaxonomy = function(id) {
            Utils.goTo('taxonomy/' + $state.params.id + '/' + id);
        };

        vm.goTo = Utils.goTo;

        vm.toggleSearch = function() {
            vm.searchActive = !vm.searchActive;
        };

        $rootScope.$on('taxonomy-' + $state.params.id + '-updated', function (e, value) {
            if (value) {
                vm.taxonomy = value;
                setActivityIcons();
            }
            else {
                $ionicLoading.show();
            }
        });

        $rootScope.$on('taxonomy-activity-updated', function (e, value) {
            if (value) {
                vm.activity = value;
                setActivityIcons();
            }
            else {
                $ionicLoading.show();
            }
        });

        $rootScope.$on('packages-updated', function (e, value) {
            if (value) {
                vm.packages = value;
                setActivityIcons();
            }
            else {
                $ionicLoading.show();
            }
        });

        $ionicLoading.show();
        PackageService.getTaxonomy($state.params.id);
        PackageService.getRoutes();
        PackageService.getTaxonomy('activity');

        return vm;
    });