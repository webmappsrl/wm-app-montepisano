angular.module('webmapp')

.controller('CustomController', function SettingsController(
    $q,
    $location,
    $rootScope,
    $templateCache,
    MapService,
    Auth,
    Account,
    Model,
    Offline,
    Utils,
    $ionicPopup,
    $state,
    $sce,
    $templateRequest,
    MapService,
    $compile,
    $scope,
    CONFIG,
    $translate
) {
    var vm = {},
        currentPageType = $state.current.name.split('.').pop(),
        currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it",
        defaultLang = "it";

    var templateUrl = $sce.getTrustedResourceUrl('templates/' + currentPageType + '.html');

    if (CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual) {
        defaultLang = CONFIG.LANGUAGES.actual.substring(0, 2);
    }

    vm.currentPage = Model.getPageByType(currentPageType);
    vm.isAPageChild = Model.isAPageChild(vm.currentPage.label);
    vm.isLoggedIn = Auth.isLoggedIn();
    vm.isBrowser = Utils.isBrowser();
    vm.openInAppBrowser = Utils.openInAppBrowser;
    vm.openInExternalBrowser = Utils.openInExternalBrowser;

    if (vm.isAPageChild) {
        vm.mainCategory = Model.getPageParent(vm.currentPage.label);
    }

    vm.goBackToCategory = function(category) {
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

    MapService.getPageInPouchDB(key).then(function(rsp) {
        var html = rsp.data;
        var openFn = vm.isBrowser ? 'vm.openInAppBrowser' : 'vm.openInExternalBrowser';
        vm.body = html.replace(/href="([^\'\"]+)/g, 'ng-click="' + openFn + '(\'$1\')" href=""');
    },
    function (e) {
        console.log(e);
    });

    $rootScope.$on('logged-in', function() {
        vm.isLoggedIn = true;
    });



    return vm;
});