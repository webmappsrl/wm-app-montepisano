angular.module('webmapp')

    .controller('PortoferraioHomeController', function PortoferraioHomeController(
        $ionicPopup,
        $translate,
        CONFIG,
        Utils
    ) {
        var vm = {};
        
        vm.goBack = Utils.goBack;
        vm.title = CONFIG.OPTIONS.title;

        vm.goTo = function (url) {
            if (url === 'card') {
                $ionicPopup.alert({
                    title: $translate.instant("ATTENZIONE"),
                    template: $translate.instant("Questa pagina sarà presto disponibile")
                })
            }
            else {
                Utils.goTo(url);
            }
        };

        return vm;
    });