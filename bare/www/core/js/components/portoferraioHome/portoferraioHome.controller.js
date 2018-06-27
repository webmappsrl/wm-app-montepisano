angular.module('webmapp')

    .controller('PortoferraioHomeController', function PortoferraioHomeController(
        Utils
    ) {
        var vm = {};
        
        vm.goTo = Utils.goTo;
        return vm;
    });