angular.module('webmapp')

    .controller('PackagesController', function CouponController(
        $http,
        $q,
        $scope,
        $state,
        $ionicPlatform,
        $rootScope,
        $ionicPopup,
        $ionicModal,
        $ionicLoading,
        Model,
        Offline,
        Auth,
        Communication,
        Utils,
        CONFIG,
        $translate,
        $window
    ) {
        var vm = {},
            userData = {};

        var modalScope = $rootScope.$new(),
            modal = {},
            modalDownloadScope = $rootScope.$new(),
            modalDownload = {},
            modalFiltersScope = $rootScope.$new(),
            modalFilters = {};

        var config = CONFIG,
            baseUrl = config.COMMUNICATION.baseUrl,
            endpoint = config.COMMUNICATION.endpoint;

        var communicationConf = CONFIG.COMMUNICATION;

        if (config.MULTIMAP && config.MULTIMAP.useReducedPackages) {
            vm.type = "reduced";
        }

        if (config.MULTIMAP && config.MULTIMAP.categoryFiltersOn) {
            vm.categoryFiltersOn = config.MULTIMAP.categoryFiltersOn;
        }

        if (config.LOGIN && config.LOGIN.useLogin) {
            vm.useLogin = config.LOGIN.useLogin;
        }

        var currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";

        modalScope.vm = {};
        modalScope.vm.hide = function () {
            modal && modal.hide();
        };

        modalDownloadScope.vm = {};
        modalDownloadScope.vm.hide = function () {
            modalDownload && modalDownload.hide();
        };

        modalFiltersScope.vm = {};
        modalFiltersScope.vm.hide = function () {
            modalFilters && modalFilters.hide();
        };

        var updateDownloadedPackagesInStorage = function () {
            localStorage.$wm_userDownloadedPackages = JSON.stringify(vm.userDownloadedPackages);
        };

        var areAllActive = function (filtersMap) {
            var allActive = true;

            for (var i in filtersMap) {
                if (i !== "Tutte") {
                    if (!filtersMap[i].value) {
                        allActive = false;
                        break;
                    }
                }
            }

            return allActive;
        };

        vm.setFilters = function () {
            vm.filters = {};
            for (var category in vm.categoriesId) {
                var tmp = {};
                tmp[category] = {
                    name: vm.categories[category].name,
                    icon: vm.categories[category].icon,
                    value: true
                };
                vm.filters = angular.extend(tmp, vm.filters);
            }

            //Apply selected filter in homepage
            if ($state.params.id && $state.params.id !== "") {
                for (var category in vm.filters) {
                    if (category === $state.params.id) {
                        vm.filters[category].value = true;
                    }
                    else {
                        vm.filters[category].value = false;
                    }
                }
            }
        };

        modalFiltersScope.vm.updateFilter = function (filterName, value) {
            if (filterName === "Tutte") {
                for (var i in modalFiltersScope.vm.filters) {
                    modalFiltersScope.vm.filters[i].value = value;
                }

                for (var i in vm.filters) {
                    vm.filters[i].value = value;
                }
            } else {
                modalFiltersScope.vm.filters[filterName].value = value;
                vm.filters[filterName].value = value;

                modalFiltersScope.vm.filters["Tutte"].value = areAllActive(modalFiltersScope.vm.filters);
            }
        };

        vm.openFilters = function () {
            var tmp = {};
            tmp["Tutte"] = {
                name: $translate.instant("Tutte"),
                icon: "wm-icon-generic",
                value: true
            };
            var activeFilters = angular.extend(tmp, vm.filters),
                allActive = areAllActive(activeFilters);

            activeFilters["Tutte"].value = allActive;
            modalFiltersScope.vm.filters = activeFilters;

            modalFilters.show();
        };

        vm.truncateTitle = function(title) {

            var ret = title;
            var maxLength = 44;
            if (ret && ret.length && ret.length > maxLength) {
                ret = ret.substr(0, maxLength - 3) + "...";
            }

            return ret;
        }

        var showPopup = function (template) {
            // TODO ...
        };

        var getPackagesIdByUserId = function (id) {
            // if (!id) {
            //     return;
            // }
            return $.getJSON(baseUrl + endpoint + 'route_id/' + id, function (data) {
                vm.userPackagesId = {};

                for (var key in data) {
                    vm.userPackagesId[key] = true;
                }

                localStorage.$wm_userPackagesId = JSON.stringify(vm.userPackagesId);

                Utils.forceDigest();

                return;
            }).fail(function () {
                console.warn('Internet connection not available. Using local storage permissions');

                vm.userPackagesId = localStorage.$wm_userPackagesId ? JSON.parse(localStorage.$wm_userPackagesId) : {};

                if (!vm.userPackagesId) {
                    console.warn("No permissions available. Shutting down...");
                }
                return;
            });
        };

        var translateCategory = function(lang, id){
            return $.getJSON(baseUrl + config.COMMUNICATION.wordPressEndpoint + 'webmapp_category/' + id + "?lang=" + lang, function (data) {
                vm.categories[id].name = data.name;
                vm.setFilters();
                return data;
            }).fail(function () {
                console.error('Translations retrive error');
                return 'Translations retrive error';
            });
        };

        var getCategoriesName = function () {

            var setCategoriesName = function(data) {
                vm.categories = {};
                vm.categoriesId = [];

                vm.packages.forEach(function (element) {
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
    
                        if (config.LANGUAGES && config.LANGUAGES.actual && currentLang !== config.LANGUAGES.actual.substring(0, 2)) {
                            translateCategory(currentLang, category.id);
                        }
                    }
                });

                vm.setFilters();
            }

            var localCategories = localStorage.$wm_categories ? JSON.parse(localStorage.$wm_categories) : {};
            if (localCategories.length) {
                setCategoriesName(localCategories);
            }

            return $.getJSON(baseUrl + config.COMMUNICATION.wordPressEndpoint + 'webmapp_category?per_page=100', function (data) {
                localStorage.$wm_categories = JSON.stringify(data);
                setCategoriesName(data);

                return data;
            }).fail(function (error) {
                console.warn('Internet connection not available. Using local storage categories');
                var localCategories = localStorage.$wm_categories ? JSON.parse(localStorage.$wm_categories) : {};
                if (!localCategories.length) {
                    console.warn("No categories available. Shutting down...");
                    return;
                }
                setCategoriesName(localCategories);
                return;
            });
        };

        var getImages = function () {
            for (var i in vm.packages) {
                $.getJSON(baseUrl + config.COMMUNICATION.wordPressEndpoint + 'media/' + vm.packages[i].featured_media, function (data) {
                    for (var pos in vm.packages) {
                        if (vm.packages[pos].featured_media === data.id) {
                            if (vm.packages[pos].imgUrl !== data.media_details.sizes.medium.source_url) {
                                vm.packages[pos].imgUrl = data.media_details.sizes.medium.source_url;
                            }
                            break;
                        }
                    }
                    localStorage.$wm_packages = JSON.stringify(vm.packages);
                    Utils.forceDigest();
                }).fail(function () {
                    console.error('images retrive error');
                });
            }
        };

        var getRoutes = function () {
            var mergePackages = function(packages, newPackages) {
                for (var i in newPackages) {
                    for (var j in packages) {
                        if (packages[j].id === newPackages[i].id) {
                            if (packages[j].imgUrl) {
                                newPackages[i].imgUrl = packages[j].imgUrl;
                            }

                            if (packages[j].packageTitle) {
                                newPackages[i].packageTitle = packages[j].packageTitle;
                            }
                            break;
                        }
                    }
                }

                return newPackages;
            };

            var setRoutes = function(data) {
                if (!vm.packages.length) {
                    vm.packages = data;
                }
                else {
                    vm.packages = mergePackages(vm.packages, data);
                }

                for (var i in vm.packages) {
                    if (!vm.packages[i].imgUrl) {
                        vm.packages[i].imgUrl = "core/images/image-loading.gif";
                    }

                    vm.packages[i].packageTitle = vm.packages[i].title.rendered;
                    
                    if (vm.packages[i].wpml_translations) {
                        for (var p in vm.packages[i].wpml_translations) {
                            if (vm.packages[i].wpml_translations[p].locale.substring(0, 2) === currentLang) {
                                vm.packages[i].packageTitle = vm.packages[i].wpml_translations[p].post_title;
                                break;
                            }
                        }
                    }
                }

                localStorage.$wm_packages = JSON.stringify(vm.packages);

                localStorage.$wm_userPackagesId = JSON.stringify(vm.userPackagesId);

                // TODO: download images
                if (vm.type === "reduced") {
                    getImages();
                }

                getCategoriesName();

                $ionicLoading.hide();
                Utils.forceDigest();
            };

            var packages = localStorage.$wm_packages ? JSON.parse(localStorage.$wm_packages) : {};

            if (packages.length) {
                setRoutes(packages);
            }

            $.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + 'route/', function (data) {
                localStorage.$wm_packages = JSON.stringify(data);
                setRoutes(data);
            }).fail(function () {
                console.warn('Internet connection not available. Using local storage routes');

                var packages = localStorage.$wm_packages ? JSON.parse(localStorage.$wm_packages) : {};

                if (!packages.length) {
                    console.warn("No routes available. Restart the app with an open connection. Shutting down the app...");
                    return;
                }
                
                setRoutes(packages);
                return;
            });
        };

        // TODO: check if a map is not setted ready but there is a folder and delete it

        vm.getPack = function(pack, $event) {
            $event.stopPropagation();

            if ((CONFIG.OPTIONS.skipLoginPublicRoutesDownload && pack.wm_route_public) || vm.isLoggedIn) {
                if (vm.userDownloadedPackages[pack.id]) {
                    vm.openPackage(pack);
                }
                else {
                    vm.downloadPack(pack);
                }
            }
            else {
                vm.openDetailsRoute(pack.id);
            }
        }

        vm.userDownloadedPackages = localStorage.$wm_userDownloadedPackages ? JSON.parse(localStorage.$wm_userDownloadedPackages) : {};
        vm.packages = localStorage.$wm_packages ? JSON.parse(localStorage.$wm_packages) : [];
        vm.userPackagesId = localStorage.$wm_userPackagesId ? JSON.parse(localStorage.$wm_userPackagesId) : {};
        vm.userPackagesIdRquested = localStorage.$wm_userPackagesIdRquested ? JSON.parse(localStorage.$wm_userPackagesIdRquested) : {};
        vm.skipLoginPublicRoutesDownload = CONFIG.OPTIONS.skipLoginPublicRoutesDownload;

        vm.isLoggedIn = Auth.isLoggedIn();
        vm.isBrowser = Utils.isBrowser();
        vm.openInAppBrowser = Utils.openInAppBrowser;
        vm.pageConf = Model.getPage('Pacchetti');
        vm.search = "";
        vm.filters = {};

        if (Auth.isLoggedIn()) {
            if (vm.packages.length === 0) {
                $ionicLoading.show({
                    template: 'Loading...'
                });
            }

            userData = Auth.getUserData();
            getPackagesIdByUserId(userData.ID);
        }
        // else {
        //     if (vm.useLogin) {
        //         setTimeout(function () {
        //             showLogin();
        //         }, 500);
        //     }
        // }

        $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/detailMapModal.html', {
            scope: modalScope,
            animation: 'slide-in-up'
        }).then(function (modalObj) {
            modal = modalObj;
        });

        $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/downloadModal.html', {
            scope: modalDownloadScope,
            animation: 'slide-in-up'
        }).then(function (modalObj) {
            modalDownload = modalObj;
        });

        $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/categoriesFiltersModal.html', {
            scope: modalFiltersScope
        }).then(function (modalObj) {
            modalFilters = modalObj;
        });

        vm.openPackage = function (pack) {
            var basePackUrl = Offline.getOfflineMhildBasePathById(pack.id);

            Communication.getLocalFile(basePackUrl + 'config.json')
                .then(function (data) {
                    localStorage.$wm_mhildConf = data;
                    localStorage.$wm_mhildBaseUrl = Offline.getOfflineMhildBasePathById(pack.id);
                    localStorage.$wm_mhildId = pack.id;

                    sessionStorage.$wm_doBack = 'allowed';

                    $ionicLoading.show({
                        template: 'Loading...'
                    });

                    location.reload();
                    Utils.forceDigest();
                });
        };

        vm.openLoginOrRegistration = function (isRegistration) {
            showLogin(isRegistration);
        };

        vm.downloadPack = function (pack) {
            $ionicPopup.confirm({
                    title: $translate.instant("ATTENZIONE"),
                    template: $translate.instant("Stai per scaricare l'itinerario sul dispositivo, vuoi procedere?")
                })
                .then(function (res) {
                    if (res) {
                        var currentId = pack.id;

                        if (typeof currentId === 'undefined') {
                            // TODO: add ionic alert
                            alert($translate.instant("Errore, effettuare logout"));
                            return;
                        }

                        $.getJSON(CONFIG.COMMUNICATION.downloadJSONUrl + currentId + '/app.json', function (data) {

                            var arrayLink = [];

                            var downloadSuccess = function () {
                                modalDownload.hide();
                                vm.userDownloadedPackages[pack.id] = true;
                                updateDownloadedPackagesInStorage();
                            };

                            var downloadFail = function () {
                                // TODO: add ionic alert
                                // TODO: rimuovere cartella, verificare interuzzione altri dowload
                                alert($translate.instant("Si è verificato un errore nello scaricamento del pacchetto, riprova"));
                                modalDownload.hide();
                                // updateDownloadedPackagesInStorage();
                            };

                            for (var i in data) {
                                if (typeof data[i] === 'string') {
                                    arrayLink.push(data[i]);
                                } else if (typeof data[i] === 'object') {
                                    for (var j in data[i]) {
                                        arrayLink.push(data[i][j]);
                                    }
                                }
                            }

                            modalDownload.show();

                            Offline
                                .downloadUserMap(currentId, arrayLink, modalDownloadScope.vm)
                                .then(downloadSuccess, downloadFail);
                        }).fail(function () {
                            // TODO: add ionic alert
                            alert($translate.instant("Si è verificato un errore nello scaricamento del pacchetto, assicurati di essere online e riprova"));
                        });
                    }
                });
        };

        vm.removePack = function (item) {
            $ionicPopup.confirm({
                    title: $translate.instant("ATTENZIONE"),
                    template: $translate.instant("Stai per rimuovere l'itinerario dal dispositivo, vuoi procedere?<br />") + $translate.instant("Questo itinerario è riservato ai clienti Verde Natura che hanno acquistato questo viaggio. Terminata la fase di sperimentazione, gli itinerari saranno disponibili a tutti")
                })
                .then(function (res) {
                    if (res) {
                        Offline.removePackById(item.id);
                        delete vm.userDownloadedPackages[item.id];
                        localStorage.$wm_userDownloadedPackages = JSON.stringify(vm.userDownloadedPackages);
                        Utils.forceDigest();
                    }
                });
        };

        vm.requestPack = function (item) {
            $ionicPopup
                .confirm({
                    title: $translate.instant("ATTENZIONE"),
                    template: $translate.instant("Stai per richiedere accesso al download dell'itinerario, intendi proseguire?")
                })
                .then(function (res) {
                    if (res) {
                        var data = {
                            email: userData.user_email,
                            pack: item.id,
                            appname: config.OPTIONS.title
                        };

                        if (vm.userPackagesIdRquested[item.id]) {
                            return;
                        }

                        $ionicLoading.show({
                            template: 'Loading...'
                        });

                        $http({
                            method: 'POST',
                            url: baseUrl + endpoint + 'mail',
                            dataType: 'json',
                            crossDomain: true,
                            data: data,
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }).success(function (data) {
                            $ionicPopup.alert({
                                template: $translate.instant("La richiesta è stata inviata, verrà processata al più presto")
                            });
                            vm.userPackagesIdRquested[item.id] = true;
                            localStorage.$wm_userPackagesIdRquested = JSON.stringify(vm.userPackagesIdRquested);
                            $ionicLoading.hide();
                        }).error(function (error) {
                            $ionicPopup.alert({
                                template: $translate.instant("Si è verificato un errore durante la richiesta, riprova")
                            });
                            $ionicLoading.hide();
                            console.error(error);
                        });

                        return data;
                    }
                });
        };

        vm.openDetailsRoute = function (id) {
            Utils.goTo('route/' + id);
        };

        vm.doRefresh = function (refresher) {
            console.log('Begin refresh');

            getRoutes();

            if (userData.ID) {
                getPackagesIdByUserId(userData.ID)
                .then(function () {
                    setTimeout(function () {
                        $scope.$broadcast('scroll.refreshComplete');
                    }, 2000);
                }, function () {
                    $ionicPopup.alert({
                        template: $translate.instant("Si è verificato un errore di connessione, riprova più tardi")
                    });
                    $scope.$broadcast('scroll.refreshComplete');
                });
            }

            // location.reload();
        };

        $ionicPlatform.ready(function () {
            $ionicPlatform.on('resume', function () {
                if (Auth.isLoggedIn()) {
                    userData = Auth.getUserData();
                    getPackagesIdByUserId(userData.ID);
                }
            });
            getRoutes();
        });

        $rootScope.$on('logged-in', function () {
            if (Auth.isLoggedIn()) {
                userData = Auth.getUserData();
                vm.isLoggedIn = true;
                vm.userDownloadedPackages = {};

                vm.userDownloadedPackages = localStorage.$wm_userDownloadedPackages ? JSON.parse(localStorage.$wm_userDownloadedPackages) : {};

                getPackagesIdByUserId(userData.ID);
                Utils.forceDigest();

                if (vm.packages.length === 0) {
                    $ionicLoading.show({
                        template: 'Loading...'
                    });
                }
            }
        });

        function showLogin(isRegistration) {
            $rootScope.showLogin(isRegistration);
        };

        return vm;
    });