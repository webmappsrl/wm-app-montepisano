angular.module('webmapp')

.controller('AttributionController', function AttributionController(
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
    CONFIG
) {
    var vm = {};

    vm.colors = CONFIG.STYLE;
    vm.openInAppBrowser = Utils.openInAppBrowser;
    vm.title = CONFIG.OPTIONS.title;

    return vm;
});