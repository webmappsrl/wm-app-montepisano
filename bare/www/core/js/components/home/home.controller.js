angular.module('webmapp')

    .controller('HomeController', function HomeController(
        $ionicLoading,
        $rootScope,
        $scope,
        $translate,
        CONFIG,
        PackageService,
        Utils
    ) {
        var vm = {};

        var registeredEvents = [];

        vm.activities = {};
        vm.columns = 1;
        vm.rows = 1;
        vm.title = "Cosa vuoi fare?";
        vm.appTitle = CONFIG.OPTIONS.title;

        vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";
        vm.defaultLang = "it";

        vm.goTo = function (id) {
            Utils.goTo('packages/' + id);
        };

        registeredEvents.push(
            $rootScope.$on('taxonomy-activity-updated', function (e, value) {
                $ionicLoading.hide();
                vm.activities = value;
                switch (Object.keys(value).length) {
                    case 1:
                    case 2:
                    case 3:
                        vm.columns = 1;
                        break;
                    case 4:
                    case 5:
                    case 6:
                    case 7:
                    case 8:
                        vm.columns = 2;
                        break;
                    case 9:
                    case 10:
                    case 11:
                    case 12:
                        vm.columns = 3;
                        break;
                    default:
                        vm.columns = 3;
                        break;
                }
                switch (Object.keys(value).length) {
                    case 1:
                        vm.rows = 1;
                        break;
                    case 2:
                    case 4:
                        vm.rows = 2;
                        break;
                    case 3:
                    case 5:
                    case 6:
                    case 9:
                        vm.rows = 3;
                        break;
                    case 7:
                    case 8:
                    case 10:
                    case 11:
                    case 12:
                        vm.rows = 4;
                        break;
                    default:
                        vm.rows = 4;
                        break;
                }
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