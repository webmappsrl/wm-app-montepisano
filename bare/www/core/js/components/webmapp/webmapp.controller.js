angular.module('webmapp')

.controller('WebmappController', function WebmappController(
    $location,
    $rootScope,
    $templateCache,
    Account,
    Model,
    Offline,
    Utils,
    $ionicPopup,
    $state,
    CONFIG,
    $translate
) {
    var vm = {};

    vm.colors = CONFIG.STYLE;
    vm.openInAppBrowser = Utils.openInAppBrowser;
    vm.currentLang = $translate.preferredLanguage();

    if (vm.currentLang === 'it') {
        vm.currentLang = '';
    }


    return vm;
});