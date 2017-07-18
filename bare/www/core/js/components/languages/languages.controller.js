angular.module('webmapp')

.controller('LanguagesController', function LanguagesController(
    $location,
    $state,
    $rootScope,
    MapService,
    Auth,
    Account,
    Model,
    Offline,
    Utils,
    $ionicPopup
) {
    var vm = {},
        offlineModal;

    var offlineScope = $rootScope.$new();

    vm.chooseLang = function(){
        $state.go('/');
        $window.location.reload();
    };

    return vm;
});