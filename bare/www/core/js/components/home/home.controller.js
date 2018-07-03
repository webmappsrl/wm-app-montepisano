angular.module('webmapp')

    .controller('HomeController', function HomeController(
        $translate,
        CONFIG,
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

        vm.search = function (text) {
            console.log(text);
        };

        vm.types = [];

        for (var i in CONFIG.OVERLAY_LAYERS) {
            vm.types.push(CONFIG.OVERLAY_LAYERS[i]);
            vm.types[vm.types.length - 1].name = vm.types[vm.types.length - 1].languages;
        }

        return vm;
    });