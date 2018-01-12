angular.module('webmapp')

.controller('HomeController', function LanguagesController(
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
    CONFIG,
    $translate,
    $ionicLoading
) {
    var vm = {},
        offlineModal;

    var offlineScope = $rootScope.$new();
    vm.categories = {};
    vm.columns = 1;
    vm.rows = 1;
    var communicationConf = CONFIG.COMMUNICATION;

    vm.currentLang = $translate.preferredLanguage();

    $ionicLoading.show();

    var getRoutes = function () {
        $.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + 'route/', function (data) {
            vm.packages = data;

            localStorage.$wm_packages = JSON.stringify(data);

            getCategoriesName();
            Utils.forceDigest();
        }).fail(function () {
            console.error('routes retrive error');
            if (vm.packages.length === 0) {
                // TODO: controllare se non si hanno pacchetti per mancanza di connessione
            }
        });
    };

    var translateCategory = function(id){
        return $.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + 'webmapp_category/' + id + "?lang=" + vm.currentLang, function (data) {
            vm.categories[id].name = data.name;
            return;
        }).fail(function () {
            console.error('Translations retrive error');
            return 'Translations retrive error';
        });
    };

    var getCategoriesName = function () {
        return $.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + 'webmapp_category?per_page=100', function (data) {
            console.log(data);
            vm.categories = {};
            var totalCategories = 0;

            vm.packages.forEach(function (element) {
                element.webmapp_category.forEach(function (category) {
                    if (!vm.categories[category]) {
                        vm.categories[category] = {
                            icon: "",
                            name: ""
                        };
                        totalCategories++;
                    }
                }, this);
            }, this);

            vm.categories[1] = {
                name: "prova",
                icon: "wm-icon-bicycle-15"
            };
            totalCategories++;
            vm.categories[2] = {
                name: "prova",
                icon: "wm-icon-bicycle-15"
            };
            totalCategories++;
            vm.categories[3] = {
                name: "prova",
                icon: "wm-icon-bicycle-15"
            };
            totalCategories++;
            vm.categories[4] = {
                name: "prova",
                icon: "wm-icon-bicycle-15"
            };
            totalCategories++;
            vm.categories[5] = {
                name: "prova",
                icon: "wm-icon-bicycle-15"
            };
            totalCategories++;
            vm.categories[6] = {
                name: "prova",
                icon: "wm-icon-bicycle-15"
            };
            totalCategories++;
            vm.categories[7] = {
                name: "prova",
                icon: "wm-icon-bicycle-15"
            };
            totalCategories++;
            vm.categories[8] = {
                name: "prova",
                icon: "wm-icon-bicycle-15"
            };
            totalCategories++;
            vm.categories[9] = {
                name: "prova",
                icon: "wm-icon-bicycle-15"
            };
            totalCategories++;
            vm.categories[10] = {
                name: "prova",
                icon: "wm-icon-bicycle-15"
            };
            totalCategories++;
            vm.categories[11] = {
                name: "prova",
                icon: "wm-icon-bicycle-15"
            };
            totalCategories++;
            vm.categories[12] = {
                name: "prova",
                icon: "wm-icon-bicycle-15"
            };
            totalCategories++;

            switch (totalCategories) {
                case 1: case 2: case 3:
                    vm.columns = 1;
                break;
                case 4: case 5: case 6: case 7: case 8:
                    vm.columns = 2;
                break;
                case 9: case 10: case 11: case 12:
                    vm.columns = 3;
                break;
                default:
                    vm.columns = 3;
                break;
            }

            switch (totalCategories) {
                case 1:
                    vm.rows = 1;
                break;
                case 2: case 4:
                    vm.rows = 2;
                break;
                case 3: case 5: case 6: case 9:
                    vm.rows = 3;
                break;
                case 7: case 8: case 10: case 11: case 12:
                    vm.rows = 4;
                break;
                default:
                    vm.rows = 4;
                break;
            }

            data.forEach(function (category) {
                if (vm.categories[category.id]) {
                    if (!category.icon) {
                        category.icon = 'wm-icon-generic';
                    }

                    vm.categories[category.id].name = category.name;
                    vm.categories[category.id].icon = category.icon;

                    if (CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual && vm.currentLang !== CONFIG.LANGUAGES.actual) {
                        translateCategory(category.id);
                    }
                }
            });

            $ionicLoading.hide();

            return;
        }).fail(function (error) {
            console.log(error);
            console.error('categories retrive error');
            return 'categories retrive error';
        });
    };

    getRoutes();

    return vm;
});