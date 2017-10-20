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
    vm.currentLang = $translate.preferredLanguage();

    vm.chooseLang = function( lang ){
        // var user = Auth.getUserData();
        // user.language = lang.substring(0,2);
        // Auth.setUserData(user);
        // $translate.preferredLanguage(user.language);
        // $translate.use(user.language);
        // window.location.reload();
    };

    setLang = function(lang) {
    }

    return vm;
});