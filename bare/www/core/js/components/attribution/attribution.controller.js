angular.module('webmapp')

    .controller('AttributionController', function AttributionController(
        $rootScope,
        $templateCache,
        Utils,
        $ionicPopup,
        CONFIG
    ) {
        var vm = {};

        vm.colors = CONFIG.STYLE;
        vm.openInAppBrowser = Utils.openInAppBrowser;
        vm.title = CONFIG.OPTIONS.title;

        return vm;
    });