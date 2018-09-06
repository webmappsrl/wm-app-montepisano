angular.module('webmapp')

    .controller('TaxonomyController', function TaxonomyController(
        $rootScope,
        $ionicLoading,
        $scope,
        $state,
        $translate,
        CONFIG,
        PackageService,
        Utils
    ) {
        var vm = {};

        var registeredEvents = [];

        vm.title = CONFIG.OPTIONS.title;
        vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";
        vm.defaultLang = CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual ? CONFIG.LANGUAGES.actual : 'it';
        vm.taxonomy = {};
        vm.loading = true;
        vm.firstLoading = true;

        vm.goTo = function (id) {
            Utils.goTo('taxonomy/' + $state.params.id + '/' + id);
        };

        vm.doRefresh = function (refresher) {
            vm.firstLoading = false;
            vm.loading = true;
            PackageService.getTaxonomy($state.params.id, true);
        };

        registeredEvents.push(
            $rootScope.$on('taxonomy-' + $state.params.id + '-updated', function (e, value) {
                vm.taxonomy = value.taxonomy;
                vm.loading = value.loading;
                if (!vm.loading) {
                    $scope.$broadcast('scroll.refreshComplete');
                    vm.firstLoading = false;
                }

                Utils.forceDigest();
            })
        );

        registeredEvents.push(
            $scope.$on('$ionicView.enter', function () {
                PackageService.getTaxonomy($state.params.id);
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