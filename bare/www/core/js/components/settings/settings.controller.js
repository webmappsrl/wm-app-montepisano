angular.module('webmapp')

    .controller('SettingsController', function SettingsController(
        $ionicPopup,
        $rootScope,
        $scope,
        $translate,
        Account,
        Auth,
        CONFIG,
        Offline,
        Utils
    ) {
        var vm = {};

        var registeredEvents = [];

        var offlineModal,
            offlineScope = $rootScope.$new();

        vm.isLoggedIn = Auth.isLoggedIn();
        vm.isBrowser = Utils.isBrowser();
        vm.openInAppBrowser = Utils.openInAppBrowser;

        Utils.createModal('core/js/modals/offlineModal.html', { backdropClickToClose: false, hardwareBackButtonClose: false }, offlineScope)
            .then(function (modal) {
                offlineModal = modal;
            });

        offlineScope.downloadMap = function () {
            Offline.downloadMap(offlineScope);
            offlineScope.downloadInProgress = true;
        };

        offlineScope.reset = function () {
            offlineScope.downloadInProgress = false;
            offlineScope.active = false;
            offlineScope.canBeEnabled = false;
            offlineScope.downloadInProgress = false;
            offlineScope.unzipInProgress = false;
            Offline.reset();
        };

        offlineScope.hide = function () {
            if (offlineScope.downloadInProgress === false &&
                offlineScope.unzipInProgress === false) {
                offlineModal.hide();
            }
        };

        offlineScope.toggleMode = function () {
            Offline.toggleMode();
            //MapService.initialize();
            offlineScope.active = Offline.isActive();
        };

        offlineScope.active = Offline.isActive();
        offlineScope.canBeEnabled = Offline.canBeEnabled();
        offlineScope.downloadInProgress = false;
        offlineScope.unzipInProgress = false;
        size = CONFIG.OFFLINE.size ? CONFIG.OFFLINE.size : 400;

        if (size > 1000) {
            size = (size / 1024).toFixed(1) + " GB";
        }
        else {
            size = size + " MB";
        }

        offlineScope.message = $translate.instant("La mappa offline occupa circa 250 MB di spazio, è consigliabile effettuare il download con una rete Wi-Fi (l'installazione può richiedere alcuni minuti)",
            {
                size: size
            });

        vm.openOfflinePage = function () {
            offlineModal && offlineModal.show();
        };

        vm.openLoginOrRegistration = function (isRegistration) {
            $rootScope.showLogin(isRegistration);
        };

        vm.logout = function () {
            var confirmPopup = $ionicPopup.confirm({
                title: $translate.instant("LOGOUT"),
                template: $translate.instant("Sei sicuro di voler effettuare il logout?")
            });

            confirmPopup.then(function (res) {
                if (res) {
                    Account.logout();
                    Auth.resetUserData();
                    $rootScope.isLoggedIn = vm.isLoggedIn = false;
                }
            });
        };

        registeredEvents.push(
            $rootScope.$on('logged-in', function () {
                vm.isLoggedIn = true;
            })
        );

        registeredEvents.push(
            $scope.$on('$destroy', function () {
                for (var i in registeredEvents) {
                    registeredEvents[i]();
                }
                delete registeredEvents;

                offlineModal.remove();
            })
        );

        return vm;
    });
