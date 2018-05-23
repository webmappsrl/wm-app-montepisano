angular.module('webmapp')

    .controller('ChiantiHomeController', function ChiantiHomeController(
        $rootScope,
        $translate,
        CONFIG,
        Utils
    ) {
        var vm = {};

        var setLanguage = function (lang) {
            $translate.preferredLanguage(lang.substring(0, 2));
            localStorage.language = JSON.stringify(lang.substring(0, 2));
            $translate.use(lang.substring(0, 2));
        };

        vm.chooseLang = function (lang) {
            setLanguage(lang);

            Utils.goTo('taxonomy/theme');
        };

        return vm;
    });