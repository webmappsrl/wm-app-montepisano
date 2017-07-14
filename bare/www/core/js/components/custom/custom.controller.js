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
    CONFIG
) {
    var vm = {},
        currentPageType = $state.current.name.split('.').pop(),
        templateUrl = $sce.getTrustedResourceUrl('templates/' + currentPageType + '.html');


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

    var key = CONFIG.OFFLINE.pagesUrl + currentPageType + '.html';
    MapService.getPageInPouchDB(key).then(function(rsp){
        var html = rsp.data;
        console.log(html);
        $templateRequest(templateUrl).then(function() {
            var openFn = vm.isBrowser ? 'vm.openInAppBrowser' : 'vm.openInExternalBrowser';


            console.log(html);

            vm.body = html.replace(/href="([^\'\"]+)/g, 'ng-click="' + openFn + '(\'$1\')" href=""');

        }, function() {
            console.log('Template retrive error', currentPageType);
        });
    });



    $rootScope.$on('logged-in', function() {
        vm.isLoggedIn = true;
    });



    return vm;
});