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
    $ionicPopup,
    CONFIG,
    $translate
) {
    var vm = {},
        offlineModal;

    var offlineScope = $rootScope.$new();

    vm.languages = CONFIG.LANGUAGES.available;

    console.log( vm.languages);

    vm.chooseLang = function( lng ){
        console.log( lng );

        $translate.use(lng.substring(0,2));
        
        //window.location.reload();
    };

    return vm;
});