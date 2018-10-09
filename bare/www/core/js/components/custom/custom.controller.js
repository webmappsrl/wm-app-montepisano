angular.module('webmapp')

    .controller('CustomController', function SettingsController(
        $ionicLoading,
        $rootScope,
        $state,
        $translate,
        Auth,
        CONFIG,
        MapService,
        Model,
        Utils
    ) {
        var vm = {},
            currentPageType = $state.current.name.split('.').pop(),
            currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it",
            defaultLang = CONFIG.MAIN ? (CONFIG.MAIN.LANGUAGES && CONFIG.MAIN.LANGUAGES.actual ? CONFIG.MAIN.LANGUAGES.actual.substring(0, 2) : "it") :
                ((CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual) ? CONFIG.LANGUAGES.actual.substring(0, 2) : 'it');

        vm.currentPage = Model.getPageByType(currentPageType);
        vm.isAPageChild = Model.isAPageChild(vm.currentPage.label);
        vm.isLoggedIn = Auth.isLoggedIn();
        vm.isBrowser = Utils.isBrowser();
        vm.openInAppBrowser = Utils.openInAppBrowser;
        vm.openInExternalBrowser = Utils.openInExternalBrowser;

        if (vm.isAPageChild) {
            vm.mainCategory = Model.getPageParent(vm.currentPage.label);
        }

        vm.goBackToCategory = function (category) {
            if (!category) {
                return;
            }
            Utils.goTo('pages/' + category.replace(/ /g, '_'));
        };

        var key = CONFIG.OFFLINE.pagesUrl + currentPageType;

        if (currentLang !== defaultLang) {
            key = key + "_" + currentLang;
        }
        key = key + ".html";

        var getPage = function () {
            if (MapService.arePagesReady()) {
                $ionicLoading.hide();
                MapService.getPageInPouchDB(key).then(function (rsp) {
                    var html = rsp.data;
                    vm.body = html.replace(/href="([^\'\"]+)/g, 'ng-click="' + 'vm.openLink' + '(\'$1\')" href=""');
                },
                    function (e) {
                        console.log(e);
                    });
            }
            else {
                setTimeout(getPage, 500);
            }
        };

        $ionicLoading.show({
            template: '<ion-spinner></ion-spinner>'
        });
        getPage();

        $rootScope.$on('logged-in', function () {
            vm.isLoggedIn = true;
        });

        return vm;
    });
