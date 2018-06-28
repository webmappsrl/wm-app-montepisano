angular.module('webmapp')

    .controller('PackagesController', function CouponController(
        $ionicLoading,
        $ionicModal,
        $rootScope,
        $scope,
        $state,
        $translate,
        Auth,
        CONFIG,
        Model,
        PackageService,
        Utils
    ) {
        var vm = {};

        var registeredEvents = [];

        var modalFiltersScope = $rootScope.$new(),
            modalFilters = {};

        var config = CONFIG;

        if (config.MULTIMAP && config.MULTIMAP.useReducedPackages) {
            vm.type = "reduced";
        }

        if (config.MULTIMAP && config.MULTIMAP.categoryFiltersOn) {
            vm.categoryFiltersOn = config.MULTIMAP.categoryFiltersOn;
        }

        if (config.LOGIN && config.LOGIN.useLogin) {
            vm.useLogin = config.LOGIN.useLogin;
        }

        vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";

        vm.userDownloadedPackages = PackageService.getDownloadedPackages();
        vm.packages = null;
        vm.userPackagesId = {};
        vm.userPackagesIdRquested = {};
        vm.skipLoginPublicRoutesDownload = CONFIG.OPTIONS.skipLoginPublicRoutesDownload;

        vm.isLoggedIn = Auth.isLoggedIn();
        vm.isBrowser = Utils.isBrowser();
        vm.openInAppBrowser = Utils.openInAppBrowser;
        vm.pageConf = Model.getPage('Pacchetti');
        vm.search = "";
        vm.filters = {};

        vm.isMultilanguage = false;

        if (CONFIG.LANGUAGES) {
            var actualInAvailable = false;
            if (CONFIG.LANGUAGES.actual && CONFIG.LANGUAGES.available) {
                for (var i in CONFIG.LANGUAGES.available) {
                    if (CONFIG.LANGUAGES.available[i].substring(0, 2) === CONFIG.LANGUAGES.actual.substring(0, 2)) {
                        actualInAvailable = true;
                        break;
                    }
                }
            }
            var minAvailableLength = 1;
            if (actualInAvailable) {
                minAvailableLength = 2;
            }

            if (CONFIG.LANGUAGES.available && CONFIG.LANGUAGES.available.length >= minAvailableLength) {
                vm.isMultilanguage = true;
            }
        }

        vm.maxDifficulty = CONFIG.MULTIMAP.maxDifficulty ? CONFIG.MULTIMAP.maxDifficulty : 5;

        $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/categoriesFiltersModal.html', {
            scope: modalFiltersScope,
            animation: 'slide-in-up'
        }).then(function (modalObj) {
            modalFilters = modalObj;
        });

        modalFiltersScope.vm = {};
        modalFiltersScope.vm.hide = function () {
            modalFilters && modalFilters.hide();
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

        var closeLoading = function () {
            if (vm.packages && vm.activities) {
                $ionicLoading.hide();
            }
        };

        vm.setFilters = function () {
            vm.filters = {};
            if (CONFIG.MULTIMAP && CONFIG.MULTIMAP.categoryFiltersOn) {
                for (var categoryId in vm.activities) {
                    var tmp = {};
                    tmp[categoryId] = {
                        name: vm.activities[categoryId].name[vm.currentLang],
                        icon: vm.activities[categoryId].icon,
                        value: true
                    };
                    vm.filters = angular.extend(tmp, vm.filters);
                }

                //Apply selected filter in homepage
                if ($state.params.id && $state.params.id !== "") {
                    for (var category in vm.filters) {
                        if (category === $state.params.id) {
                            vm.filters[category].value = true;
                        } else {
                            vm.filters[category].value = false;
                        }
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

        vm.truncateTitle = function (title) {

            var ret = title;
            var maxLength = 44;
            if (ret && ret.length && ret.length > maxLength) {
                ret = ret.substr(0, maxLength - 3) + "...";
            }

            return ret;
        }

        vm.downloadPack = function (pack) {
            PackageService.downloadPack(pack.id)
        };

        vm.openPackage = function (pack) {
            PackageService.openPackage(pack.id);
        };

        vm.getPack = function (pack, $event) {
            $event.stopPropagation();

            if ((CONFIG.OPTIONS.skipLoginPublicRoutesDownload && pack.wm_route_public) || vm.isLoggedIn) {
                if (vm.userDownloadedPackages[pack.id]) {
                    vm.openPackage(pack);
                } else {
                    vm.downloadPack(pack);
                }
            } else {
                vm.openDetailsRoute(pack.id);
            }
        }

        vm.openLoginOrRegistration = function (isRegistration) {
            $rootScope.showLogin(isRegistration);
        };

        vm.openDetailsRoute = function (id) {
            Utils.goTo('route/' + id);
        };

        vm.doRefresh = function (refresher) {
            console.log('Begin refresh');

            PackageService.getRoutes(true);

            if (Auth.isLoggedIn()) {
                PackageService.getPackagesIdByUserId();
            }

            // location.reload();
        };

        registeredEvents.push(
            $rootScope.$on('logged-in', function () {
                if (Auth.isLoggedIn()) {
                    userData = Auth.getUserData();
                    vm.isLoggedIn = true;
                    vm.userDownloadedPackages = {};

                    PackageService.getDownloadedPackages();
                    PackageService.getPackagesIdByUserId();
                    Utils.forceDigest();
                }
            })
        );

        registeredEvents.push(
            $rootScope.$on('userPackagesId-updated', function (e, value) {
                vm.userPackagesId = value;
                setTimeout(function () {
                    $scope.$broadcast('scroll.refreshComplete');
                    Utils.forceDigest();
                }, 2000);
                Utils.forceDigest();
            })
        );

        registeredEvents.push(
            $rootScope.$on('packages-updated', function (e, value) {
                vm.packages = value;
                closeLoading();
                Utils.forceDigest();
            })
        );

        registeredEvents.push(
            $rootScope.$on('taxonomy-activity-updated', function (e, value) {
                vm.activities = value;
                vm.setFilters();
                closeLoading();
                Utils.forceDigest();
            })
        );

        registeredEvents.push(
            $rootScope.$on('userDownloadedPackages-updated', function (e, value) {
                vm.userDownloadedPackages = value;
                Utils.forceDigest();
            })
        );

        registeredEvents.push(
            $scope.$on('$ionicView.enter', function () {
                if (Auth.isLoggedIn()) {
                    userData = Auth.getUserData();
                    PackageService.getPackagesIdByUserId();
                }
                $ionicLoading.show({
                    template: '<ion-spinner></ion-spinner>'
                });
                PackageService.getTaxonomy('activity');
                PackageService.getRoutes(true);
            })
        );

        registeredEvents.push(
            $scope.$on('$ionicView.beforeLeave', function () {
                for (var i in registeredEvents) {
                    registeredEvents[i]();
                }
                delete registeredEvents;
            })
        );

        return vm;
    });