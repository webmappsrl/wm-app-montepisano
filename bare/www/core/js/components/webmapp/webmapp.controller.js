angular.module('webmapp')

.controller('WebmappController', function WebmappController(
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

    return vm;
});