angular.module('webmapp')

    .controller('DetailRouteController', function DetailRouteController(
        $http,
        $state,
        $scope,
        $rootScope,
        $sce,
        $ionicLoading,
        $ionicPopup,
        $ionicModal,
        $ionicSlideBoxDelegate,
        MapService,
        Model,
        Utils,
        CONFIG,
        $translate,
        Auth,
        Offline,
        Communication
    ) {
        var vm = {},
            current = $state.current || {},
            params = $state.params || {},
            currentLang = $translate.preferredLanguage();

        var modalScope = $rootScope.$new(),
            modal = {},
            modalDownloadScope = $rootScope.$new(),
            modalDownload = {},
            modalImage = {};

        var isOnline = false,
            isBrowser = vm.isBrowser = Utils.isBrowser();

        modalScope.vm = {};
        modalScope.parent = vm;
        modalDownloadScope.vm = {};
        modalDownloadScope.vm.hide = function () {
            modalDownload && modalDownload.hide();
        };

        $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/downloadModal.html', {
            scope: modalDownloadScope,
            animation: 'slide-in-up'
        }).then(function (modalObj) {
            modalDownload = modalObj;
        });

        vm.avoidModal = CONFIG.OPTIONS.avoidModalInDetails;
        vm.colors = CONFIG.STYLE;
        vm.imageUrl = CONFIG.OFFLINE.imagesUrl;
        vm.goBack = Utils.goBack;

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

        vm.packages = JSON.parse(localStorage.$wm_packages);
        vm.userPackagesId = localStorage.$wm_userPackagesId ? JSON.parse(localStorage.$wm_userPackagesId) : {};
        vm.userDownloadedPackages = localStorage.$wm_userDownloadedPackages ? JSON.parse(localStorage.$wm_userDownloadedPackages) : {};
        vm.userPackagesIdRquested = localStorage.$wm_userPackagesIdRquested ? JSON.parse(localStorage.$wm_userPackagesIdRquested) : {};
        vm.isLoggedIn = Auth.isLoggedIn();
        var userData = vm.isLoggedIn ? Auth.getUserData() : {};
        vm.id = params.id;

        if (vm.isLoggedIn) {
            vm.userDownloadedPackages = localStorage.$wm_usersPackagesAvailable ? JSON.parse(localStorage.$wm_usersPackagesAvailable)[userData.ID] : {};
            localStorage.$wm_userDownloadedPackages = JSON.stringify(vm.userDownloadedPackages);
        }

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

        var getRoute = function (id) {
            for (var i = 0; i < vm.packages.length; i++) {
                if (vm.packages[i].id == id) {
                    if (CONFIG.LANGUAGES.actual && currentLang !== CONFIG.LANGUAGES.actual) {

                        for (var lang in vm.packages[i].wpml_translations) {
                            if (vm.packages[i].wpml_translations[lang].locale.substring(0, 2) === currentLang) {
                                getTranslatedContent(vm.packages[i].wpml_translations[lang].id);
                                break;
                            }
                        }

                    }
                    return vm.packages[i];
                }
            }
        };

        var routeDetail = getRoute(params.id);
        vm.isPublic = routeDetail.wm_route_public;

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

        vm.openVoucherModal = function () {
            if (vm.isLoggedIn) {
                $ionicPopup.prompt({
                        title: $translate.instant('Voucher'),
                        subTitle: $translate.instant('Inserisci il voucher da attivare'),
                        inputType: 'text',
                        inputPlaceholder: $translate.instant('Voucher')
                    })
                    .then(function (res) {
                        if (res) {
                            var data = $.param({
                                route_id: routeDetail.id,
                                user_id: userData.ID,
                                code: res
                            });

                            var config = {
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
                                }
                            }

                            $ionicLoading.show();

                            $http.post(
                                    CONFIG.COMMUNICATION.baseUrl + CONFIG.COMMUNICATION.endpoint + 'voucher',
                                    data,
                                    config
                                )
                                .success(function (data, status, headers, config) {
                                    $ionicLoading.hide();
                                    ///Update offline data
                                    vm.userPackagesId[routeDetail.id] = true;
                                    localStorage.$wm_userPackagesId = JSON.stringify(vm.userPackagesId);
                                })
                                .error(function (data, status, header, config) {
                                    $ionicLoading.hide();
                                    if (data.error === "Voucher Expired") {
                                        $ionicPopup.alert({
                                            template: $translate.instant("Il voucher che hai utilizzato è scaduto")
                                        });
                                    } else {
                                        $ionicPopup.alert({
                                            template: $translate.instant("Il voucher che hai inserito non è valido. Controlla di averlo inserito correttamente e inseriscilo nuovamente.")
                                        });
                                    }
                                });
                        }
                    });

                // $http({
                //     method: 'POST',
                //     url: CONFIG.COMMUNICATION.baseUrl + CONFIG.COMMUNICATION.endpoint + 'voucher',
                //     dataType: 'json',
                //     crossDomain: true,
                //     data: data,
                //     headers: {
                //         'Content-Type': 'application/json'
                //     }
                // }).success(function (data) {
                //     console.log(data);
                // }).error(function (error) {
                //     console.error(error);
                // });
            } else {
                notLoggedIn();
            }

        };

        vm.requestRoute = function () {
            if (vm.isLoggedIn) {
                requestPack(routeDetail);
            } else {
                notLoggedIn();
            }
        };

        var requestPack = function (item) {
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
                            appname: CONFIG.OPTIONS.title
                        };

                        if (vm.userPackagesIdRquested[item.id]) {
                            return;
                        }

                        $ionicLoading.show({
                            template: 'Loading...'
                        });

                        $http({
                            method: 'POST',
                            url: CONFIG.COMMUNICATION.baseUrl + CONFIG.COMMUNICATION.endpoint + 'mail',
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

        vm.openPackage = function () {
            var basePackUrl = Offline.getOfflineMhildBasePathById(routeDetail.id);

            Communication.getLocalFile(basePackUrl + 'config.json')
                .then(function (data) {
                    localStorage.$wm_mhildConf = data;
                    localStorage.$wm_mhildBaseUrl = Offline.getOfflineMhildBasePathById(routeDetail.id);
                    localStorage.$wm_mhildId = routeDetail.id;

                    sessionStorage.$wm_doBack = 'allowed';

                    $ionicLoading.show({
                        template: 'Loading...'
                    });

                    Utils.goTo('/');
                    location.reload();
                    Utils.forceDigest();
                });
        };

        vm.downloadPack = function () {
            pack = routeDetail;
            if (vm.isLoggedIn) {
                $ionicPopup.confirm({
                        title: $translate.instant("ATTENZIONE"),
                        template: $translate.instant("Stai per scaricare l'itinerario sul dispositivo, vuoi procedere?")
                    })
                    .then(function (res) {
                        if (res) {
                            var currentId = pack.id;

                            $.getJSON(CONFIG.COMMUNICATION.downloadJSONUrl + currentId + '/app.json', function (data) {

                                var arrayLink = [];

                                var downloadSuccess = function () {
                                    modalDownload.hide();
                                    vm.userDownloadedPackages[pack.id] = true;
                                    localStorage.$wm_userDownloadedPackages = JSON.stringify(vm.userDownloadedPackages);

                                    var available = localStorage.$wm_usersPackagesAvailable ? JSON.parse(localStorage.$wm_usersPackagesAvailable) : {};
                                    var tmp = {};
                                    tmp[userData.ID] = vm.userDownloadedPackages;
                                    available = angular.extend(available, tmp);
                                    localStorage.$wm_usersPackagesAvailable = JSON.stringify(available);
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
            }
            else {
                notLoggedIn();
            }

        };

        vm.removePack = function () {
            var item = routeDetail;
            $ionicPopup.confirm({
                    title: $translate.instant("ATTENZIONE"),
                    template: $translate.instant("Stai per rimuovere l'itinerario dal dispositivo, vuoi procedere?<br />")
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

        var getPackagesIdByUserId = function (id) {
            return $.getJSON(CONFIG.COMMUNICATION.baseUrl + CONFIG.COMMUNICATION.endpoint + 'route_id/' + id, function (data) {
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

        function showLogin(isRegistration) {
            $rootScope.showLogin(isRegistration);
        };

        $rootScope.$on('logged-in', function () {
            if (Auth.isLoggedIn()) {
                userData = Auth.getUserData();
                vm.isLoggedIn = true;
                vm.userDownloadedPackages = {};

                //Add packages downloaded and available for the current user
                vm.userDownloadedPackages = localStorage.$wm_usersPackagesAvailable ? JSON.parse(localStorage.$wm_usersPackagesAvailable)[userData.ID] : {};
                localStorage.$wm_userDownloadedPackages = JSON.stringify(vm.userDownloadedPackages);

                getPackagesIdByUserId(userData.ID);

                Utils.forceDigest();
            }
        });

        return vm;
    });