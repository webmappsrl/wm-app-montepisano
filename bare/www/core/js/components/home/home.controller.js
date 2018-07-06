angular.module('webmapp')

.controller('HomeController', function HomeController(
    $translate,
    $rootScope,
    CONFIG,
    Search,
    Utils
) {
    var vm = {};

    vm.activities = {};
    vm.columns = 1;
    vm.rows = 1;
    vm.appTitle = CONFIG.OPTIONS.title;

    vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";
    vm.defaultLang = "it";
    vm.columns = 2;
    vm.rows = 2;

    vm.colors = CONFIG.STYLE;

    vm.searchString = "";

    vm.goToSearchByString = function() {
        $rootScope.searchQuery = vm.searchString;
        Utils.goTo('search');
    };

    vm.goToSearchByCategory = function(id) {
        $rootScope.searchLayers = [id];
        Utils.goTo('search');
    };

    vm.types = [];

    for (var i = 0; i < 4; i++) {
        vm.types.push(CONFIG.OVERLAY_LAYERS[i]);
        vm.types[vm.types.length - 1].name = vm.types[vm.types.length - 1].languages;
    }

    return vm;
});