angular.module('webmapp')

    .controller('DetailTaxonomyController', function DetailTaxonomyController(
        CONFIG,
        $ionicLoading,
        $rootScope,
        $state,
        $translate,
        PackageService,
        Utils
    ) {
        var vm = {};

        vm.title = CONFIG.OPTIONS.title;
        var communicationConf = CONFIG.COMMUNICATION;

        currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";
        vm.taxonomy = {};
        vm.item = {};
        vm.routes = {};
        vm.activities = {};

        vm.fullDescription = false;

        var taxonomyType = $state.params.parentId,
            id = $state.params.id * 1; // * 1 is to make id integrer

        var forceDigest = function() {
            setTimeout(function() {
                $(window).trigger('resize');
                Utils.forceDigest();
            }, 100);
        };

        vm.toggleDescription = function () {
            vm.fullDescription = !vm.fullDescription;
            forceDigest();
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

        $ionicLoading.show();
        PackageService.getRoutes();
        PackageService.getTaxonomy('activity');
        PackageService.getTaxonomy(taxonomyType);        
        return vm;
    });