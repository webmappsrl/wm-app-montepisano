angular.module('webmapp')

    .controller('LanguagesController', function LanguagesController(
        $rootScope,
        $window,
        Auth,
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
        vm.isLoggedIn = false;

        var useLogin = CONFIG.LOGIN && CONFIG.LOGIN.useLogin;
        var userData = {};

        var setLanguage = function (lang) {
            $translate.preferredLanguage(lang.substring(0, 2));
            $window.localStorage.language = JSON.stringify(lang.substring(0, 2));
        };

        vm.chooseLang = function (lang) {
            setLanguage(lang);

            window.location.reload();
        };

        vm.openInAppBrowser = function (url) {
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
                    Utils.forceDigest();
                }
            });
        };

        vm.login = function () {
            setTimeout(function () {
                showLogin();
            }, 500);
        }

        $rootScope.$on('logged-in', function () {
            if (Auth.isLoggedIn()) {
                vm.isLoggedIn = true;
            }
        });

        if (useLogin && !Auth.isLoggedIn()) {
            vm.isLoggedIn = false;
        } else if (useLogin) {
            vm.isLoggedIn = true;
            userData = Auth.getUserData();
        }

        return vm;
    });