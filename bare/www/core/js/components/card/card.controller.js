angular.module('webmapp')
    .controller('CardController', function CardController(
        $ionicPopup,
        $rootScope,
        $translate,
        Auth,
        Utils
    ) {
        var vm = {};

        vm.isLoggedIn = Auth.isLoggedIn();
        vm.userData = vm.isLoggedIn ? Auth.getUserData() : {};
        vm.goTo = Utils.goTo;

        vm.title = "Card";

        vm.login = function () {
            $rootScope.showLogin();
        };

        vm.logout = function () {
            var confirmPopup = $ionicPopup.confirm({
                title: $translate.instant("LOGOUT"),
                template: $translate.instant("Sei sicuro di voler effettuare il logout?")
            });

            confirmPopup.then(function (res) {
                if (res) {
                    // for (var i in vm.userDownloadedPackages) {
                    //     Offline.removePackById(i);
                    // }

                    delete localStorage.$wm_userPackages;

                    Auth.resetUserData();
                    $rootScope.isLoggedIn = vm.isLoggedIn = false;
                    Utils.forceDigest();
                }
            });
        };

        $rootScope.$on('logged-in', function () {
            if (Auth.isLoggedIn()) {
                vm.isLoggedIn = true;
                vm.userData = Auth.getUserData();
            }
        });

        return vm;
    });