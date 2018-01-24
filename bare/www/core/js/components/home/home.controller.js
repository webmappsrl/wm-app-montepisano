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
    vm.title = "Cosa vuoi fare?";
    vm.asyncTranslations = 0;
    vm.appTitle = CONFIG.OPTIONS.title;

    vm.currentLang = $translate.preferredLanguage();

    if (CONFIG.LOGIN && CONFIG.LOGIN.useLogin) {
        vm.useLogin = CONFIG.LOGIN.useLogin;
    }

    $ionicLoading.show();

    var getRoutes = function () {
        $.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + 'route/', function (data) {
            vm.packages = data;

            localStorage.$wm_packages = JSON.stringify(data);

            getCategoriesName();
            Utils.forceDigest();
        }).fail(function () {
            console.warn("Internet connection not available. Using local storage packages");
            vm.packages = localStorage.$wm_packages ? JSON.parse(localStorage.$wm_packages) : {};
            if (!vm.packages.length) {
                finishLoading();
                //Popup connection not available
                console.warn("Looks like this is your first application load. Do it again with a connection open");
                return;
            }
            getCategoriesName();
        });
    };

    var translateCategory = function(id){
        return $.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + 'webmapp_category/' + id + "?lang=" + vm.currentLang, function (data) {
            vm.categories[id].name = data.name;

            var tmp = localStorage.$wm_categories_translated ? JSON.parse(localStorage.$wm_categories_translated) : {};

            tmp[vm.currentLang] = vm.categories;

            localStorage.$wm_categories_translated = JSON.stringify(tmp);

            vm.asyncTranslations--;

            if (vm.asyncTranslations === 0) {
                finishLoading();
            }
            return;
        }).fail(function () {
            console.warn('Internet connection not available. Using local storage translation for ' + id);
            //Retrieve category from offline if available
            var tmp = localStorage.$wm_categories_translated ? JSON.parse(localStorage.$wm_categories_translated) : {};

            if (tmp !== {}) {
                vm.categories[id].name = tmp[vm.currentLang][id].name;
            }
            vm.asyncTranslations--;
            if (vm.asyncTranslations === 0) {
                finishLoading();
            }
            return;
        });
    };

    var getCategoriesName = function () {
        return $.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + 'webmapp_category?per_page=100', function (data) {
            localStorage.$wm_categories = JSON.stringify(data);

            setCategoriesName(data);

            return;
        }).fail(function (error) {
            console.warn("Internet connection not available. Using local storage categories");
            var categoriesStorage = localStorage.$wm_categories ? JSON.parse(localStorage.$wm_categories) : {};

            if (!categoriesStorage.length) {
                //Popup connection not available
                finishLoading();
                console.warn("Looks like this is your first application load. Do it again with a connection open");
                return;
            }

            setCategoriesName(categoriesStorage);
            return 'categories retrive error';
        });
    };

    var setCategoriesName = function(data) {
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
                    vm.asyncTranslations++;
                    translateCategory(category.id);
                }
            }
        });

        if (vm.asyncTranslations === 0) {
            finishLoading();
        }
    };

    vm.goTo = function (id) {
        Utils.goTo('packages/' + id);
    };

    var finishLoading = function() {
        $ionicLoading.hide();
        if (vm.useLogin && !Auth.isLoggedIn()) {
            setTimeout(function () {
                showLogin();
            }, 500);
        }
    }

    function showLogin(isRegistration) {
        $rootScope.showLogin(isRegistration);
    };

    $rootScope.$on('logged-in', function () {
        if (Auth.isLoggedIn()) {
            location.href = "#/page/help";
        }
    });

    getRoutes();

    return vm;
});