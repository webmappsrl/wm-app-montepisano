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
        vm.taxonomy = {};
        vm.search = "";
        vm.searchActive = false;

        vm.goTo = function(id) {
            Utils.goTo('taxonomy/' + $state.params.id + '/' + id);
        };

        vm.toggleSearch = function() {
            vm.searchActive = !vm.searchActive;
        };

        $rootScope.$on('taxonomy-' + $state.params.id + '-updated', function (e, value) {
            $ionicLoading.hide();
            vm.taxonomy = value;
        });

        $ionicLoading.show();
        PackageService.getTaxonomy($state.params.id);

        return vm;
    });