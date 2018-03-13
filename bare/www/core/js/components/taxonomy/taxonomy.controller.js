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
        vm.taxonomy = {};

        vm.goTo = function(id) {
            Utils.goTo('taxonomy/' + $state.params.id + '/' + id);
        };

        $rootScope.$on('taxonomy-' + $state.params.id + '-updated', function (e, value) {
            $ionicLoading.hide();
            vm.taxonomy = value;
        });

        PackageService.getTaxonomy($state.params.id);
        PackageService.getTaxonomy('when');

        return vm;
    });