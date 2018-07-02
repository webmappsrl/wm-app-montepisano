angular.module('webmapp')

    .controller('LanguagesController', function LanguagesController(
        $ionicPopup,
        $rootScope,
        $translate,
        $window,
        Auth,
        CONFIG,
        Utils
    ) {
        var vm = {};

        vm.languages = CONFIG.LANGUAGES.available ? CONFIG.LANGUAGES.available : "";
        vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";
        vm.defaultLang = (CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual) ? CONFIG.LANGUAGES.actual.substring(0, 2) : "it";
        vm.version = CONFIG.VERSION;
        vm.privacyUrl = 'http://www.webmapp.it/privacy/';
        vm.goBack = Utils.goBack;

        for (var i in vm.languages) {
            vm.languages[i] = vm.languages[i].substring(0, 2);
        }

        var updatePrivacyUrl = function () {
            if (CONFIG.COMMUNICATION.privacy) {
                if (CONFIG.COMMUNICATION.privacy[vm.currentLang]) {
                    vm.privacyUrl = CONFIG.COMMUNICATION.privacy[vm.currentLang];
                }
                else if (CONFIG.COMMUNICATION.privacy[vm.defaultLang]) {
                    vm.privacyUrl = CONFIG.COMMUNICATION.privacy[vm.defaultLang];
                }
                else if (typeof CONFIG.COMMUNICATION.privacy !== 'string') {
                    vm.privacyUrl = CONFIG.COMMUNICATION.privacy[Object.keys(CONFIG.COMMUNICATION.privacy)[0]];
                }
                else {
                    vm.privacyUrl = CONFIG.COMMUNICATION.privacy;
                }
            }
        };

        vm.isLoggedIn = false;

        vm.useLogin = CONFIG.LOGIN && CONFIG.LOGIN.useLogin;

        vm.chooseLang = function (lang) {
            $translate.preferredLanguage(lang.substring(0, 2));
            $translate.use(lang.substring(0, 2));
            $window.localStorage.language = JSON.stringify(lang.substring(0, 2));
            vm.currentLang = lang.substring(0, 2);
            updatePrivacyUrl();
            $rootScope.$emit('changed-language', lang.substring(0, 2));
            Utils.forceDigest();
        };

        vm.openInExternalBrowser = Utils.openInExternalBrowser;

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

        updatePrivacyUrl();

        return vm;
    });