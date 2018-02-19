angular.module('webmapp')

.controller('WebmappController', function WebmappController(
    Utils,
    $ionicPopup,
    CONFIG,
    $translate
) {
    var vm = {};

    vm.colors = CONFIG.STYLE;
    vm.openInAppBrowser = Utils.openInAppBrowser;
    vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";

    if (vm.currentLang === 'it') {
        vm.currentLang = '';
    }


    return vm;
});