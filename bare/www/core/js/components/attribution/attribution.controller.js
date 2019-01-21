angular.module('webmapp')

    .controller('AttributionController', function AttributionController(
        ConfigurationService,
        Utils
    ) {
        var vm = {};

        vm.colors = ConfigurationService.getStyle();
        vm.openInAppBrowser = Utils.openInAppBrowser;
        vm.title = ConfigurationService.getTitle();

        return vm;
    });
