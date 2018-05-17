angular.module('webmapp')

    .controller('AttributionController', function AttributionController(
        Utils,
        CONFIG
    ) {
        var vm = {};

        vm.colors = CONFIG.MAIN ? CONFIG.MAIN.STYLE : CONFIG.STYLE;
        vm.openInAppBrowser = Utils.openInAppBrowser;
        vm.title = CONFIG.OPTIONS.title;

        return vm;
    });