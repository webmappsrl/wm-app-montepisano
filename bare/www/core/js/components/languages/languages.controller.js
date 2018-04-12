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

        vm.languages = CONFIG.LANGUAGES.available ? CONFIG.LANGUAGES.available : "";
        vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";
        vm.version = CONFIG.VERSION;
        vm.privacyUrl = CONFIG.COMMUNICATION.privacy;
        vm.isLoggedIn = false;

        vm.useLogin = CONFIG.LOGIN && CONFIG.LOGIN.useLogin;
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

        if (vm.useLogin && !Auth.isLoggedIn()) {
            vm.isLoggedIn = false;
        } else if (vm.useLogin) {
            vm.isLoggedIn = true;
            userData = Auth.getUserData();
        }

        return vm;
    });