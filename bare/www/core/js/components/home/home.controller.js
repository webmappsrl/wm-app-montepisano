angular.module('webmapp')

    .controller('HomeController', function HomeController(
        $ionicLoading,
        $rootScope,
        $translate,
        CONFIG,
        Offline,
        PackageService,
        Utils
    ) {
        var vm = {},
            offlineModal;

        var offlineScope = $rootScope.$new(),
            communicationConf = CONFIG.COMMUNICATION;

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

        $rootScope.$on('taxonomy-activity-updated', function (e, value) {
            $ionicLoading.hide();
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
            vm.activities = value;
            Utils.forceDigest();
        });

        $ionicLoading.show();
        PackageService.getTaxonomy('activity');

        return vm;
    });