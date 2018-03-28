angular.module('webmapp')

    .controller('DetailTaxonomyController', function DetailTaxonomyController(
        CONFIG,
        $ionicLoading,
        $rootScope,
        $state,
        $translate,
        MapService,
        PackageService,
        Utils
    ) {
        var vm = {};

        vm.title = CONFIG.OPTIONS.title;
        var communicationConf = CONFIG.COMMUNICATION;

        vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";
        vm.taxonomy = {};
        vm.item = {};
        vm.routes = {};
        vm.activities = {};
        vm.userDownloadedPackages = {};

        vm.fullDescription = false;

        if (CONFIG.MAIN) {
            Utils.goTo("/");
            var timeoutFunction = function () {
                if (MapService.isReady()) {
                    $ionicLoading.hide();
                    // Utils.goTo("layer/Tappe/801");
                    Utils.goTo(CONFIG.OPTIONS.startUrl);
                } else {
                    setTimeout(timeoutFunction, 300);
                }
            };
            $ionicLoading.show();
            timeoutFunction();
            return vm;
        }

        var taxonomyType = $state.params.parentId,
            id = $state.params.id * 1; // * 1 is to make id integrer

        var forceDigest = function () {
            setTimeout(function () {
                $(window).trigger('resize');
                Utils.forceDigest();
            }, 100);
        };

        vm.toggleDescription = function () {
            vm.fullDescription = !vm.fullDescription;
            forceDigest();
        };

        vm.openOrDownloadPack = function (packId) {
            if (vm.userDownloadedPackages[packId]) {
                PackageService.openPackage(packId);
            } else {
                PackageService.downloadPack(packId);
            }
        };

        $rootScope.$on('taxonomy-' + taxonomyType + '-updated', function (e, value) {
            $ionicLoading.hide();
            vm.taxonomy = value;
            vm.item = value[id];
            vm.title = vm.item.name;
            forceDigest();
        });

        $rootScope.$on('taxonomy-activity-updated', function (e, value) {
            $ionicLoading.hide();
            vm.activities = value;
            for (var i in vm.activities) {
                if (!vm.activities[i].icon) {
                    vm.activities[i].icon = 'wm-icon-help-circled';
                }
            }
            forceDigest();
        });

        $rootScope.$on('packages-updated', function (e, value) {
            $ionicLoading.hide();
            vm.routes = {};
            for (var i in value) {
                if (value[i][taxonomyType]) {
                    for (var j in value[i][taxonomyType]) {
                        if (value[i][taxonomyType][j] === id) {
                            vm.routes[i] = value[i];
                            break;
                        }
                    }
                }
            }
            forceDigest();
        });

        $rootScope.$on('userDownloadedPackages-updated', function (e, value) {
            vm.userDownloadedPackages = value;
            Utils.forceDigest();
        });

        $ionicLoading.show();
        PackageService.getRoutes();
        PackageService.getDownloadedPackages();
        PackageService.getTaxonomy('activity');
        PackageService.getTaxonomy(taxonomyType);

        setTimeout(function () {
            MapService.disableInteractions();
            MapService.resetView();
            var features = MapService.getFeatureIdMap();
            console.log(features);
            MapService.addFeaturesToFilteredLayer({
                'details': features
            }, true);
            // MapService.showAllLayers();
        }, 500);
        return vm;
    });