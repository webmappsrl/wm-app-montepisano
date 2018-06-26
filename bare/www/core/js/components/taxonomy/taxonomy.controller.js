angular.module('webmapp')

    .controller('TaxonomyController', function TaxonomyController(
        $rootScope,
        $ionicLoading,
        $scope,
        $state,
        $translate,
        PackageService,
        Utils,
        CONFIG
    ) {
        var vm = {};

        var communicationConf = CONFIG.COMMUNICATION,
            registeredEvents = [];

        vm.title = CONFIG.OPTIONS.title;
        vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";
        vm.defaultLang = CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual ? CONFIG.LANGUAGES.actual : 'it';
        vm.taxonomy = {};

        vm.goTo = function (id) {
            Utils.goTo('taxonomy/' + $state.params.id + '/' + id);
        };

        registeredEvents.push(
            $rootScope.$on('taxonomy-' + $state.params.id + '-updated', function (e, value) {
                $ionicLoading.hide();
                vm.taxonomy = value;
            })
        );

        registeredEvents.push(
            $scope.$on('$ionicView.enter', function () {
                $ionicLoading.show({
                    template: '<ion-spinner></ion-spinner>'
                });
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