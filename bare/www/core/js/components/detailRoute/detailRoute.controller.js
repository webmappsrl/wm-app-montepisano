angular.module('webmapp')

    .controller('DetailRouteController', function DetailRouteController(
        $http,
        $ionicLoading,
        $ionicModal,
        $ionicPlatform,
        $ionicPopup,
        $ionicSlideBoxDelegate,
        $rootScope,
        $sce,
        $scope,
        $state,
        $translate,
        Auth,
        Communication,
        CONFIG,
        MapService,
        Model,
        Offline,
        PackageService,
        Utils
    ) {
        var vm = {},
            current = $state.current || {},
            params = $state.params || {},
            isOnline = false,
            isBrowser = vm.isBrowser = Utils.isBrowser();

        var registeredEvents = [];

        var modalScope = $rootScope.$new(),
            modal = {},
            modalImage = {};

        var userData = {},
            routeDetail;

        modalScope.vm = {};
        modalScope.parent = vm;

        vm.avoidModal = CONFIG.OPTIONS.avoidModalInDetails;
        vm.colors = CONFIG.MAIN ? CONFIG.MAIN.STYLE : CONFIG.STYLE;
        vm.imageUrl = CONFIG.OFFLINE.imagesUrl;
        vm.goBack = Utils.goBack;
        vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";
        vm.packages = {};
        vm.userPackagesId = {};
        vm.userDownloadedPackages = {};
        vm.userPackagesIdRquested = {};
        vm.isLoggedIn = Auth.isLoggedIn();
        vm.isPublic = false;
        vm.id = params.id;
        vm.openInAppBrowser = Utils.openInAppBrowser;
        vm.openInExternalBrowser = Utils.openInExternalBrowser;

        vm.voucherAvailable = CONFIG.MULTIMAP.purchaseType ? CONFIG.MULTIMAP.purchaseType.includes('voucher') : false;
        vm.purchaseAvailable = CONFIG.MULTIMAP.purchaseType ? CONFIG.MULTIMAP.purchaseType.includes('purchase') : false;

        if (!vm.voucherAvailable && !vm.purchaseAvailable) {
            vm.voucherAvailable = true;
            vm.purchaseAvailable = true;
        }

        vm.maxDifficulty = CONFIG.MULTIMAP.maxDifficulty ? CONFIG.MULTIMAP.maxDifficulty : 5;

        $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/imagesModal.html', {
            scope: modalScope,
            animation: 'slide-in-up'
        }).then(function (modalObj) {
            modalImage = modalObj;
        });

        vm.openImageModal = function () {
            if (vm.imageGallery.length > 1) {
                modalImage.show();
            }
        };

        modalScope.vm.hide = function () {
            modalImage && modalImage.hide();
        };

        modalScope.vm.nextImage = function () {
            if ($ionicSlideBoxDelegate._instances &&
                $ionicSlideBoxDelegate._instances.length > 0) {
                $ionicSlideBoxDelegate._instances[$ionicSlideBoxDelegate._instances.length - 1].next();
            }
        };

        modalScope.vm.prevImage = function () {
            if ($ionicSlideBoxDelegate._instances &&
                $ionicSlideBoxDelegate._instances.length > 0) {
                $ionicSlideBoxDelegate._instances[$ionicSlideBoxDelegate._instances.length - 1].previous();
            }
        };

        vm.showLeft = function () {
            if (!vm.hasGallery) {
                return false;
            }

            if ($ionicSlideBoxDelegate._instances &&
                $ionicSlideBoxDelegate._instances.length > 0) {
                return $ionicSlideBoxDelegate._instances[$ionicSlideBoxDelegate._instances.length - 1].currentIndex() !== 0;
            }
        };

        vm.showRight = function () {
            if (!vm.hasGallery) {
                return false;
            }

            if (vm.imageGallery.length === 0) {
                return false;
            }

            if ($ionicSlideBoxDelegate._instances &&
                $ionicSlideBoxDelegate._instances.length > 0) {
                return $ionicSlideBoxDelegate._instances[$ionicSlideBoxDelegate._instances.length - 1].currentIndex() !== vm.imageGallery.length - 1;
            }
        };

        var showLogin = function (isRegistration) {
            $rootScope.showLogin(isRegistration);
        };

        var notLoggedIn = function () {
            $ionicPopup.confirm({
                title: $translate.instant("ATTENZIONE"),
                template: $translate.instant("Devi eseguire l'accesso per poter usufruire di questa funzionalità")
            })
                .then(function (res) {
                    if (res) {
                        showLogin();
                    }
                });
        };

        var getTranslatedContent = function (id) {
            $ionicLoading.show({
                template: '<ion-spinner></ion-spinner>'
            });
            $.getJSON(CONFIG.COMMUNICATION.baseUrl + CONFIG.COMMUNICATION.wordPressEndpoint + 'route/' + id, function (data) {
                vm.title = data.title.rendered;
                vm.description = data.content.rendered;
                vm.description = vm.description.replace(new RegExp(/href="([^\'\"]+)"/g), 'href="" onclick="window.open(\'$1\', \'_system\', \'\')"');
                vm.description = $sce.trustAsHtml(vm.description);
                vm.gallery = data.n7webmap_route_media_gallery;
                $ionicLoading.hide();
            }).fail(function () {
                $ionicLoading.hide();
                console.error('translation retrive error');
            });
        };

        vm.openVoucherModal = function () {
            if (vm.isLoggedIn) {
                PackageService.requestPackageWithVoucher(routeDetail.id);
            } else {
                notLoggedIn();
            }
        };

        vm.requestRoute = function () {
            if (vm.isLoggedIn) {
                PackageService.requestPack(routeDetail.id);
            } else {
                notLoggedIn();
            }
        };

        vm.downloadPack = function () {
            if ((CONFIG.OPTIONS.skipLoginPublicRoutesDownload && routeDetail.wm_route_public) || vm.isLoggedIn) {
                PackageService.downloadPack(routeDetail.id);
            } else {
                notLoggedIn();
            }

        };

        vm.openPackage = function () {
            if ((CONFIG.OPTIONS.skipLoginPublicRoutesDownload && routeDetail.wm_route_public) || vm.isLoggedIn) {
                PackageService.openPackage(routeDetail.id);
            } else {
                notLoggedIn();
            }
        };

        vm.removePack = function () {
            PackageService.removePack(routeDetail.id);
        };

        registeredEvents.push(
            $rootScope.$on('packages-updated', function (e, value) {
                routeDetail = value[vm.id];

                vm.isPublic = routeDetail.wm_route_public;
                vm.skipLogin = CONFIG.OPTIONS.skipLoginPublicRoutesDownload ? CONFIG.OPTIONS.skipLoginPublicRoutesDownload : false;

                if (routeDetail) {
                    vm.title = routeDetail.title.rendered;
                    vm.description = routeDetail.content.rendered;
                    vm.description = vm.description.replace(new RegExp(/href="([^\'\"]+)"/g), 'href="" onclick="window.open(\'$1\', \'_system\', \'\')"');
                    vm.description = $sce.trustAsHtml(vm.description);
                    vm.gallery = routeDetail.n7webmap_route_media_gallery;
                    if (vm.gallery && vm.gallery[0] && vm.gallery[0].sizes) {
                        vm.featureImage = vm.gallery[0].sizes.medium_large;
                    }
                    vm.codeRoute = routeDetail.n7webmapp_route_cod;
                    vm.difficulty = routeDetail.n7webmapp_route_difficulty;
                }

                vm.imageGallery = [];
                for (var g = 0; g < vm.gallery.length; g++) {
                    vm.imageGallery.push({ src: vm.gallery[g].sizes.medium_large });
                }

                vm.hasGallery = vm.imageGallery.length > 0;

                for (var lang in routeDetail.wpml_translations) {
                    if (routeDetail.wpml_translations[lang].locale.substring(0, 2) === vm.currentLang) {
                        getTranslatedContent(routeDetail.wpml_translations[lang].id);
                        break;
                    }
                }
            })
        );

        registeredEvents.push(
            $rootScope.$on('userPackagesId-updated', function (e, value) {
                vm.userPackagesId = value;
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
            $rootScope.$on('userPackagesIdRquested-updated', function (e, value) {
                vm.userPackagesIdRquested = value;
                Utils.forceDigest();
            })
        );

        registeredEvents.push(
            $rootScope.$on('logged-in', function () {
                if (Auth.isLoggedIn()) {
                    userData = Auth.getUserData();
                    vm.isLoggedIn = true;

                    PackageService.getPackagesIdByUserId();

                    Utils.forceDigest();
                }
            })
        );

        registeredEvents.push(
            $scope.$on('$ionicView.enter', function () {
                PackageService.getRoutes();
                PackageService.getDownloadedPackages();

                if (Auth.isLoggedIn()) {
                    userData = Auth.getUserData();
                    vm.isLoggedIn = true;

                    PackageService.getPackagesIdByUserId();

                    Utils.forceDigest();
                }
            })
        );

        registeredEvents.push(
            $scope.$on('$destroy', function () {
                if ($ionicSlideBoxDelegate._instances &&
                    $ionicSlideBoxDelegate._instances.length > 0) {
                    $ionicSlideBoxDelegate._instances[$ionicSlideBoxDelegate._instances.length - 1].kill();
                    $ionicSlideBoxDelegate.update();
                }
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