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
        vm.userData = {};
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

        var updateUserData = function () {
            vm.userData = Auth.getUserData();
            if (!vm.userData.voucher) {
                vm.userData.voucher = $translate.instant("Nessun codice disponibile");
            }
            if (!vm.userData.image) {
                vm.userData.image = "core/images/placeholder.png";
            }
        };

        $rootScope.$on('logged-in', function () {
            if (Auth.isLoggedIn()) {
                vm.isLoggedIn = true;
                updateUserData();
            }
        });

        if (Auth.isLoggedIn()) {
            updateUserData();
        }

        return vm;
    });