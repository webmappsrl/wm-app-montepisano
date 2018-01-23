angular.module('webmapp')

.controller('LanguagesController', function LanguagesController(
    $location,
    $state,
    $rootScope,
    $window,
    MapService,
    Auth,
    Account,
    Model,
    Offline,
    Utils,
    $ionicPopup,
    CONFIG,
    $translate
) {
    var vm = {},
        offlineModal;

    var offlineScope = $rootScope.$new();

    vm.languages = CONFIG.LANGUAGES.available;
    vm.currentLang = $translate.preferredLanguage();
    vm.version = CONFIG.VERSION;
    vm.privacyUrl = CONFIG.COMMUNICATION.privacy;

    var useLogin = CONFIG.LOGIN && CONFIG.LOGIN.useLogin;
    var userData = {};

    var setLanguage = function(lang) {
        $translate.preferredLanguage(lang.substring(0,2));
        $window.localStorage.language = JSON.stringify(lang.substring(0,2));
    };

    vm.chooseLang = function( lang ){
        setLanguage(lang);
        
        window.location.reload();
    };

    vm.openInAppBrowser = function(url) {
        Utils.openInAppBrowser(url);
    };

    function showLogin(isRegistration) {
        $rootScope.showLogin(isRegistration);
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
                delete localStorage.$wm_userDownloadedPackages;

                Auth.resetUserData();
                $rootScope.isLoggedIn = vm.isLoggedIn = false;
                if (useLogin) {
                    showLogin();
                }
                Utils.forceDigest();
            }
        });
    };

    $rootScope.$on('logged-in', function () {
        if (Auth.isLoggedIn()) {
            location.href = "#/page/help";
        }
    });

    if (useLogin && !Auth.isLoggedIn()) {
        setTimeout(function () {
            showLogin();
        }, 500);
    }
    else if (useLogin) {
        vm.isLoggedIn = true;
        userData = Auth.getUserData();
    }

    return vm;
});