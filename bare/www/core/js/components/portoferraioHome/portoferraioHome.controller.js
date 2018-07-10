angular.module('webmapp')

    .controller('PortoferraioHomeController', function PortoferraioHomeController(
        CONFIG,
        Utils
    ) {
        var vm = {};
        
        vm.goTo = Utils.goTo;
        vm.goBack = Utils.goBack;
        vm.title = CONFIG.OPTIONS.title;

        return vm;
    });