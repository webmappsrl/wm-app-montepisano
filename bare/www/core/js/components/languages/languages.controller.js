angular.module('webmapp')

    .controller('LanguagesController', function LanguagesController(
        $ionicPopup,
        $rootScope,
        $scope,
        $translate,
        $window,
        Auth,
        CONFIG,
        ConfigurationService,
        PackageService,
        Utils
    ) {
        var vm = {};

        var registeredEvents = [];

        vm.languages = CONFIG.LANGUAGES.available ? CONFIG.LANGUAGES.available : "";
        vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";
        vm.defaultLang = ConfigurationService.getDefaultLang();
        vm.version = CONFIG.VERSION;
        vm.privacyUrl = 'http://www.webmapp.it/privacy/';
        vm.purchaseAvailable = true;

        vm.isLoggedIn = false;

        vm.useLogin = CONFIG.LOGIN && CONFIG.LOGIN.useLogin;
        var userData = {};

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

        vm.chooseLang = function (lang) {
            $translate.preferredLanguage(lang.substring(0, 2));
            $translate.use(lang.substring(0, 2));
            $window.localStorage.language = JSON.stringify(lang.substring(0, 2));
            vm.currentLang = lang.substring(0, 2);
            updatePrivacyUrl();
            $rootScope.$emit('language-changed', lang.substring(0, 2));
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
        };

        vm.restorePurchases = function () {
            PackageService.restorePurchases();
        };

        registeredEvents.push(
            $rootScope.$on('logged-in', function () {
                if (Auth.isLoggedIn()) {
                    vm.isLoggedIn = true;
                }
            })
        );

        registeredEvents.push(
            $scope.$on('$destroy', function () {
                for (var i in registeredEvents) {
                    registeredEvents[i]();
                }
                delete registeredEvents;
            })
        );

        if (CONFIG.MULTIMAP && CONFIG.MULTIMAP.purchaseType) {
            for (var i in CONFIG.MULTIMAP.purchaseType) {
                if (CONFIG.MULTIMAP.purchaseType[i] === 'purchase') {
                    vm.purchaseAvailable = true;
                }
                if (CONFIG.MULTIMAP.purchaseType[i] === 'voucher') {
                    vm.voucherAvailable = true;
                }
            }
        }

        if (!vm.purchaseAvailable && !vm.voucherAvailable) {
            vm.purchaseAvailable = true;
            vm.voucherAvailable = true;
        }

        for (var i in vm.languages) {
            vm.languages[i] = vm.languages[i].substring(0, 2);
        }

        if (vm.useLogin && !Auth.isLoggedIn()) {
            vm.isLoggedIn = false;
        } else if (vm.useLogin) {
            vm.isLoggedIn = true;
            userData = Auth.getUserData();
        }

        updatePrivacyUrl();

        return vm;
    });
