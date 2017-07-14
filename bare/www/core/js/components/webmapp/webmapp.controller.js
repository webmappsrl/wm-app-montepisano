angular.module('webmapp')

.controller('WebmappController', function SettingsController(
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
    $state
) {
    var vm = {},
        currentPageType = $state.current.name.split('.').pop();

    vm.currentPage = Model.getPageByType(currentPageType);
    vm.isAPageChild = Model.isAPageChild(vm.currentPage.label);
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

    return vm;
});