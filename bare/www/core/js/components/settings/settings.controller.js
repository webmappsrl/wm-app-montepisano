angular.module('webmapp')

.controller('SettingsController', function SettingsController(
    $location,
    $rootScope,
    MapService,
    Auth,
    Account,
    Model,
    Offline,
    Utils,
    $ionicPopup,
    $translate
) {
    var vm = {},
        offlineModal;

    var offlineScope = $rootScope.$new();

    vm.isLoggedIn = Auth.isLoggedIn();
    vm.isBrowser = Utils.isBrowser();
    vm.openInAppBrowser = Utils.openInAppBrowser;

    Utils.createModal('core/js/modals/offlineModal.html', {backdropClickToClose: false, hardwareBackButtonClose: false}, offlineScope)
        .then(function(modal) {
            offlineModal = modal;
        });

    offlineScope.downloadMap = function() {
        Offline.downloadMap(offlineScope);
        offlineScope.downloadInProgress = true;
    };

    offlineScope.reset = function() {
        offlineScope.downloadInProgress = false;
        offlineScope.active = false;
        offlineScope.canBeEnabled = false;
        offlineScope.downloadInProgress = false;
        offlineScope.unzipInProgress = false;
        Offline.reset();
    };

    offlineScope.hide = function() {
        if (offlineScope.downloadInProgress === false &&
            offlineScope.unzipInProgress === false) {
            offlineModal.hide();
        }
    };

    offlineScope.toggleMode = function() {
        Offline.toggleMode();
        //MapService.initialize();
        offlineScope.active = Offline.isActive();
    };


    offlineScope.active = Offline.isActive();
    offlineScope.canBeEnabled = Offline.canBeEnabled();
    offlineScope.downloadInProgress = false;
    offlineScope.unzipInProgress = false;

    vm.openOfflinePage = function() {
        offlineModal && offlineModal.show();
    };

    vm.openLoginOrRegistration = function(isRegistration) {
        $rootScope.showLogin(isRegistration);
    };

    vm.logout = function() {
        var confirmPopup = $ionicPopup.confirm({
            title: $translate.instant("LOGOUT"),
            template: $translate.instant("Sei sicuro di voler effettuare il logout?")
        });

        confirmPopup.then(function(res) {
            if (res) {
                Account.logout();
                Auth.resetUserData();
                $rootScope.isLoggedIn = vm.isLoggedIn = false;
            }
        });
    };

    $rootScope.$on('logged-in', function() {
        vm.isLoggedIn = true;
    });

    return vm;
});