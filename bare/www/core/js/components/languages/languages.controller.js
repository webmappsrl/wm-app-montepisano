angular.module('webmapp')

.controller('LanguagesController', function LanguagesController(
    $location,
    $state,
    $rootScope,
    $window,
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

    // vm.languages = CONFIG.LANGUAGES.available;
    vm.currentLang = $translate.preferredLanguage();

    var setLanguage = function(lang) {
        $translate.preferredLanguage(lang.substring(0,2));
        $window.localStorage.language = JSON.stringify(lang.substring(0,2));
    };

    vm.chooseLang = function( lang ){
        setLanguage(lang);
        
        window.location.reload();
    };

    return vm;
});