angular.module('webmapp')

    .controller('DetailRouteController', function DetailRouteController(
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
        CONFIG,
        md5,
        PackageService,
        Utils
    ) {
        var vm = {},
            params = $state.params || {};

        var registeredEvents = [];

        var modalScope = $rootScope.$new(),
            modalImage = {};

        var routeDetail;

        modalScope.vm = {};
        modalScope.parent = vm;

        vm.avoidModal = CONFIG.OPTIONS.avoidModalInDetails;
        vm.colors = CONFIG.MAIN ? CONFIG.MAIN.STYLE : CONFIG.STYLE;
        vm.imageUrl = CONFIG.OFFLINE.imagesUrl;
        vm.goBack = Utils.goBack;
        vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";
        vm.defaultLang = (CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual) ? CONFIG.LANGUAGES.actual.substring(0, 2) : 'it';
        vm.packages = {};
        vm.userPackagesId = {};
        vm.userDownloadedPackages = {};
        vm.userPackagesIdRquested = {};
        vm.isLoggedIn = Auth.isLoggedIn();
        vm.isPublic = false;
        vm.id = params.id;
        vm.openInAppBrowser = Utils.openInAppBrowser;
        vm.openInExternalBrowser = Utils.openInExternalBrowser;

        vm.voucherAvailable = false;
        vm.purchaseAvailable = false;

        if (CONFIG.MULTIMAP && CONFIG.MULTIMAP.purchaseType) {
            for (var i in CONFIG.MULTIMAP.purchaseType) {
                switch (CONFIG.MULTIMAP.purchaseType[i]) {
                    case 'purchase':
                        vm.purchaseAvailable = true;
                        break;
                    case 'voucher':
                        vm.voucherAvailable = true
                        break;
                    default:
                        break;
                }
            }
        }

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
            if (vm.imageGallery.length > 1 || (vm.imageGallery.length === 1 && vm.imageGallery[0].caption && vm.imageGallery[0].caption !== "")) {
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
            }).then(function (res) {
                if (res) {
                    showLogin();
                }
            });
        };

        vm.goToInfo = function () {
            if (vm.isLoggedIn) {
                var md5Hash = privateKey.voucher + '-' + vm.id + '-' + userData.ID;
                md5Hash = md5.createHash(md5Hash);

                var data = '?routeId=' + vm.id + '&userId=' + userData.ID + '&lang=' + vm.currentLang + '&hash=' + md5Hash;

                Utils.openInExternalBrowser("https://api.webmapp.it/services/merinfo/vn/info.php" + data);
            } else {
                notLoggedIn();
            }
        };

        vm.useVoucher = function () {
            if (vm.isLoggedIn) {
                PackageService.useVoucher(routeDetail.id);
            }
            else {
                notLoggedIn();
            }
        };

        vm.applyVoucherFunction = function () {
            if (vm.isAndroid) {
                vm.useVoucher();
            }
            else {
                vm.goToInfo();
            }
        };

        vm.buyRoute = function () {
            if (vm.isLoggedIn) {
                PackageService.buyPack(routeDetail.id);
            } else {
                notLoggedIn();
            }
        };

        vm.downloadPackage = function () {
            if ((CONFIG.OPTIONS.skipLoginPublicRoutesDownload && routeDetail.wm_route_public) || vm.isLoggedIn) {
                PackageService.downloadPackage(routeDetail.id);
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
                routeDetail = value.packages[vm.id];

                vm.isPublic = routeDetail.wm_route_public;
                vm.skipLogin = CONFIG.OPTIONS.skipLoginPublicRoutesDownload ? CONFIG.OPTIONS.skipLoginPublicRoutesDownload : false;

                if (routeDetail) {
                    vm.title = routeDetail.title.rendered;
                    if (routeDetail.packageTitle) {
                        if (routeDetail.packageTitle[vm.currentLang]) {
                            vm.title = routeDetail.packageTitle[vm.currentLang];
                        }
                        else if (routeDetail.packageTitle[vm.defaultLang]) {
                            vm.title = routeDetail.packageTitle[vm.defaultLang];
                        }
                        else if (typeof routeDetail.packageTitle !== 'string') {
                            vm.title = routeDetail.packageTitle[Object.keys(routeDetail.packageTitle)[0]];
                        }
                    }
                    vm.description = "";

                    if (routeDetail.packageDescription) {
                        if (routeDetail.packageDescription[vm.currentLang]) {
                            vm.description = routeDetail.packageDescription[vm.currentLang];
                        }
                        else if (routeDetail.packageDescription[vm.defaultLang]) {
                            vm.description = routeDetail.packageDescription[vm.defaultLang];
                        }
                        else if (typeof routeDetail.packageDescription !== 'string') {
                            vm.description = routeDetail.packageDescription[Object.keys(routeDetail.packageDescription)[0]];
                        }
                    }

                    vm.description = vm.description.replace(new RegExp(/href="([^\'\"]+)"/g), 'onclick="window.open(\'$1\', \'_system\', \'\')"');
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

                $ionicLoading.hide();
            })
        );

        registeredEvents.push(
            $rootScope.$on('userPackagesId-updated', function (e, value) {
                vm.userPackagesId = value;

                if ($rootScope.routeDownload) {
                    delete $rootScope.routeDownload;
                    if (Auth.isLoggedIn() && vm.userPackagesId[vm.id]) {
                        setTimeout(function () {
                            vm.downloadPackage();
                        }, 500);
                    }
                }

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
            $scope.$on('$destroy', function () {
                if ($ionicSlideBoxDelegate._instances &&
                    $ionicSlideBoxDelegate._instances.length > 0) {
                    $ionicSlideBoxDelegate._instances[$ionicSlideBoxDelegate._instances.length - 1].kill();
                    $ionicSlideBoxDelegate.update();
                }

                for (var i in registeredEvents) {
                    registeredEvents[i]();
                }
                delete registeredEvents;

                modalImage.remove();
            })
        );

        $ionicLoading.show({
            template: '<ion-spinner></ion-spinner>'
        });
        PackageService.getRoutes();
        PackageService.getDownloadedPackages();
        vm.isAndroid = !window.cordova || window.cordova.platformId === 'ios' ? false : true;

        if (Auth.isLoggedIn()) {
            userData = Auth.getUserData();
            vm.isLoggedIn = true;

            PackageService.getPackagesIdByUserId();

            Utils.forceDigest();
        }

        return vm;
    });
