angular.module('webmapp')

    .controller('PortoferraioWelcomeController', function PortoferraioWelcomeController(
        Utils
    ) {
        var vm = {};
        
        vm.goTo = Utils.goTo;
        return vm;
    });