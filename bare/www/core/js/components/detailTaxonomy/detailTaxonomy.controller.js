angular.module('webmapp')

    .controller('DetailTaxonomyController', function DetailTaxonomyController(
        Utils,
        CONFIG,
        $translate,
        $ionicLoading,
        $state
    ) {
        var vm = {};

        vm.title = CONFIG.OPTIONS.title;
        var communicationConf = CONFIG.COMMUNICATION;

        currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";
        vm.taxonomy = {};
        vm.item = {};
        vm.taxonomyRoutes = {};
        vm.routes = {};
        vm.fullDescription = false;
        vm.categories = {};
        vm.categoriesId = [];

        var taxonomyType = $state.params.parentId,
            id = $state.params.id * 1; // * 1 is to make id integrer

        var getCategoriesName = function () {

            var translateCategory = function (lang, id) {
                return $.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + 'webmapp_category/' + id + "?lang=" + lang, function (data) {
                    vm.categories[id].name = data.name;
                    Utils.forceDigest();
                    return data;
                }).fail(function () {
                    console.error('Translations retrive error');
                    return 'Translations retrive error';
                });
            };

            var setCategoriesName = function (data) {
                vm.categories = {};
                vm.categoriesId = [];

                vm.routes.forEach(function (element) {
                    element.webmapp_category.forEach(function (category) {
                        vm.categoriesId[category] = true;
                    }, this);
                }, this);

                data.forEach(function (category) {
                    if (vm.categoriesId[category.id]) {
                        var tmp = {};
                        if (!category.icon) {
                            category.icon = 'wm-icon-generic';
                        }
                        tmp[category.id] = {
                            name: category.name,
                            icon: category.icon
                        };
                        vm.categories = angular.extend(vm.categories, tmp);

                        if (CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual && currentLang !== CONFIG.LANGUAGES.actual.substring(0, 2)) {
                            translateCategory(currentLang, category.id);
                        }
                    }
                });
            };

            var localCategories = localStorage.$wm_categories ? JSON.parse(localStorage.$wm_categories) : {};
            if (localCategories.length) {
                setCategoriesName(localCategories);
                Utils.forceDigest();
            }

            return $.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + 'webmapp_category?per_page=100', function (data) {
                localStorage.$wm_categories = JSON.stringify(data);
                setCategoriesName(data);
                Utils.forceDigest();
                return data;
            }).fail(function (error) {
                console.warn('Internet connection not available. Using local storage categories');
                var localCategories = localStorage.$wm_categories ? JSON.parse(localStorage.$wm_categories) : {};
                if (!localCategories.length) {
                    console.warn("No categories available. Shutting down...");
                    return;
                }
                setCategoriesName(localCategories);
                Utils.forceDigest();
                return;
            });
        };

        var setItem = function (itemToSet) {
            vm.item = itemToSet
            vm.title = vm.item.name;

            vm.taxonomyRoutes = localStorage.$wm_taxonomyRoutes ? JSON.parse(localStorage.$wm_taxonomyRoutes) : {};

            console.log(vm.taxonomyRoutes);

            if (vm.taxonomyRoutes && vm.taxonomyRoutes[taxonomyType] && vm.taxonomyRoutes[taxonomyType][id]) {
                vm.routes = vm.taxonomyRoutes[taxonomyType][id];
                getCategoriesName();
                Utils.forceDigest();
            }

            $.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + 'route?' + taxonomyType + '=' + id, function (data) {
                vm.routes = data;

                if (vm.taxonomyRoutes) {
                    if (vm.taxonomyRoutes[taxonomyType]) {
                        vm.taxonomyRoutes[taxonomyType][id] = vm.routes;
                    } else {
                        vm.taxonomyRoutes[taxonomyType] = {};
                        vm.taxonomyRoutes[taxonomyType][id] = vm.routes;
                    }
                } else {
                    vm.taxonomyRoutes = {};
                    vm.taxonomyRoutes[taxonomyType] = {};
                    vm.taxonomyRoutes[taxonomyType][id] = vm.routes;
                }

                localStorage.$wm_taxonomyRoutes = JSON.stringify(vm.taxonomyRoutes);

                getCategoriesName();
                Utils.forceDigest();
            }).fail(function () {
                if (!vm.routes.length) {
                    console.log("no routes")
                }
                else {
                    getCategoriesName();
                }
            });
        };

        var getTaxonomyDetails = function () {
            vm.taxonomy = localStorage.$wm_taxonomy ? JSON.parse(localStorage.$wm_taxonomy) : [];
            if (!vm.taxonomy[0]) {
                $ionicLoading.show();
            } else {
                for (var i in vm.taxonomy) {
                    if (vm.taxonomy[i].id === id) {
                        setItem(vm.taxonomy[i]);
                        break;
                    }
                }

                if (!vm.item.id) {
                    $ionicLoading.show();
                }
            }
            Utils.forceDigest();

            $.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + taxonomyType + '/' + id, function (data) {
                vm.taxonomy = localStorage.$wm_taxonomy ? JSON.parse(localStorage.$wm_taxonomy) : [];
                var pos = 0;
                if (vm.taxonomy[0]) {
                    for (var i in vm.taxonomy) {
                        if (vm.taxonomy[i].id === data.id) {
                            if (data.count > 0) {
                                vm.taxonomy[i] = data;
                                setItem(vm.taxonomy[i]);
                            } else {
                                delete vm.taxonomy[i];
                                console.log("no item");
                            }
                            break;
                        }
                    }
                } else {
                    if (data.count > 0) {
                        vm.taxonomy[0] = data;
                        setItem(vm.taxonomy[0]);
                    } else {
                        console.log("no item")
                    }
                }

                localStorage.$wm_taxonomy = JSON.stringify(vm.taxonomy);

                finishLoading();

                Utils.forceDigest();
            }).fail(function () {
                console.warn("Internet connection not available. Using local storage taxonomy");
                vm.taxonomy = localStorage.$wm_taxonomy ? JSON.parse(localStorage.$wm_taxonomy) : [];
                if (!vm.taxonomy.length) {
                    finishLoading();
                    //Popup connection not available
                    console.warn("Looks like this is your first application load. Do it again with a connection open");
                    return;
                } else {
                    for (var i in vm.taxonomy) {
                        if (vm.taxonomy[i].id === id) {
                            setItem(vm.taxonomy[i]);
                            break;
                        }
                    }

                    if (!vm.item.id) {
                        console.log("no item")
                    }
                    finishLoading();
                }
            });
        };

        var finishLoading = function () {
            $ionicLoading.hide();
        };

        vm.toggleDescription = function () {
            vm.fullDescription = !vm.fullDescription;
            Utils.forceDigest();
        };

        getTaxonomyDetails();
        return vm;
    });