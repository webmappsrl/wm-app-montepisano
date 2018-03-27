angular.module('webmapp')

    .controller('DetailRouteController', function DetailRouteController(
        $http,
        $ionicLoading,
        $ionicModal,
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

        var modalScope = $rootScope.$new(),
            modal = {},
            modalImage = {};

        var userData = {},
            routeDetail;

        modalScope.vm = {};
        modalScope.parent = vm;

        vm.avoidModal = CONFIG.OPTIONS.avoidModalInDetails;
        vm.colors = CONFIG.STYLE;
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

        if (CONFIG.MAIN) {
            Utils.goTo(CONFIG.OPTIONS.startUrl);
        }

        $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/imagesModal.html', {
            scope: modalScope,
            animation: 'slide-in-up'
        }).then(function (modalObj) {
            modalImage = modalObj;
        });

        vm.openImageModal = function () {
            modalImage.show();
        };

        modalScope.vm.hide = function () {
            modalImage && modalImage.hide();
        };

        modalScope.vm.nextImage = function () {
            if ($ionicSlideBoxDelegate._instances &&
                $ionicSlideBoxDelegate._instances[0]) {
                $ionicSlideBoxDelegate._instances[0].next();
            }
        };

        modalScope.vm.prevImage = function () {
            if ($ionicSlideBoxDelegate._instances &&
                $ionicSlideBoxDelegate._instances[0]) {
                $ionicSlideBoxDelegate._instances[0].previous();
            }
        };

        vm.showLeft = function () {
            if (!vm.hasGallery) {
                return false;
            }

            if ($ionicSlideBoxDelegate._instances &&
                $ionicSlideBoxDelegate._instances[0]) {
                return $ionicSlideBoxDelegate._instances[0].currentIndex() !== 0;
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
                $ionicSlideBoxDelegate._instances[0]) {
                return $ionicSlideBoxDelegate._instances[0].currentIndex() !== vm.imageGallery.length - 1;
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
                template: 'Loading...'
            });
            return $.getJSON(CONFIG.COMMUNICATION.baseUrl + CONFIG.COMMUNICATION.wordPressEndpoint + 'route/' + id, function (data) {
                vm.title = data.title.rendered;
                vm.description = data.content.rendered;
                vm.gallery = data.n7webmap_route_media_gallery;
                $ionicLoading.hide();
                return data;
            }).fail(function () {
                $ionicLoading.hide();
                console.error('translation retrive error');
                return 'translation retrive error';
            });
        };

        $rootScope.$on('packages-updated', function (e, value) {
            routeDetail = value[vm.id];

            vm.isPublic = routeDetail.wm_route_public;
            vm.skipLogin = CONFIG.OPTIONS.skipLoginPublicRoutesDownload ? CONFIG.OPTIONS.skipLoginPublicRoutesDownload : false;

            if (routeDetail) {
                vm.title = routeDetail.title.rendered;
                vm.description = routeDetail.content.rendered;
                vm.gallery = routeDetail.n7webmap_route_media_gallery;
                if (vm.gallery && vm.gallery[0] && vm.gallery[0].sizes) {
                    vm.featureImage = vm.gallery[0].sizes.medium_large;
                }
                vm.codeRoute = routeDetail.n7webmapp_route_cod;
                vm.difficulty = routeDetail.n7webmapp_route_difficulty;
            }

            vm.imageGallery = [];
            for (var g = 0; g < vm.gallery.length; g++) {
                vm.imageGallery.push(vm.gallery[g].sizes.medium_large);
            }

            vm.hasGallery = vm.imageGallery.length > 0;

            for (var lang in routeDetail.wpml_translations) {
                if (routeDetail.wpml_translations[lang].locale.substring(0, 2) === vm.currentLang) {
                    getTranslatedContent(routeDetail.wpml_translations[lang].id);
                    break;
                }
            }
        });

        $rootScope.$on('userPackagesId-updated', function (e, value) {
            vm.userPackagesId = value;
            Utils.forceDigest();
        });

        $rootScope.$on('userDownloadedPackages-updated', function (e, value) {
            vm.userDownloadedPackages = value;
            Utils.forceDigest();
        });

        $rootScope.$on('userPackagesIdRquested-updated', function (e, value) {
            vm.userPackagesIdRquested = value;
            Utils.forceDigest();
        });

        $rootScope.$on('logged-in', function () {
            if (Auth.isLoggedIn()) {
                userData = Auth.getUserData();
                vm.isLoggedIn = true;

                PackageService.getPackagesIdByUserId();

                Utils.forceDigest();
            }
        });

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

        PackageService.getRoutes();
        PackageService.getDownloadedPackages();

        if (Auth.isLoggedIn()) {
            userData = Auth.getUserData();
            vm.isLoggedIn = true;

            PackageService.getPackagesIdByUserId();

            Utils.forceDigest();
        }

        return vm;
    });