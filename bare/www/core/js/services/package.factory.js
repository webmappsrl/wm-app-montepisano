/* ---------------------------------------------------------- *\
 * PACKAGE FACTORY
 * PackageService
 *
 * Provide all the function and the metadata for the routes and
 * packages
 * Every function does not return directly a value but emit an
 * event to notify the update of the specified data
 * Make sure to listen to the specific event to update your data
 * The data will be emitted twice, one for the instant data (not
 * yet updated) and one for the final updated data (that are
 * emitted after some time)
 *
 * @example
 * getRoutes() update the packages object and notify everyone
 * the updated values
\* ---------------------------------------------------------- */

angular.module('webmapp')

    .factory('PackageService', function PackageService(
        $http,
        $rootScope,
        $ionicLoading,
        $ionicModal,
        $ionicPopup,
        $translate,
        CONFIG,
        Auth,
        Communication,
        MapService,
        Offline,
        Utils
    ) {
        var packageService = {};

        var communicationConf = CONFIG.COMMUNICATION,
            currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : 'it',
            defaultLang = (CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual) ? CONFIG.LANGUAGES.actual.substring(0, 2) : 'it';

        var packages = localStorage.$wm_packages ? JSON.parse(localStorage.$wm_packages) : null,
            userPackagesId = localStorage.$wm_userPackagesId ? JSON.parse(localStorage.$wm_userPackagesId) : null,
            userDownloadedPackages = {},
            packagesToActivate = localStorage.$wm_packagesToActivate ? JSON.parse(localStorage.$wm_packagesToActivate) : [],
            taxonomy = localStorage.$wm_taxonomy ? JSON.parse(localStorage.$wm_taxonomy) : {
                activity: null,
                theme: null,
                when: null,
                where: null,
                who: null
            };

        var updated = {
            packages: false,
            taxonomy: {
                activity: false,
                theme: false,
                when: false,
                where: false,
                who: false
            }
        };

        // To let update from old version
        if (localStorage.$wm_userDownloadedPackages) {
            userDownloadedPackages = JSON.parse(localStorage.$wm_userDownloadedPackages);
            MapService.setItemInLocalStorage("$wm_userDownloadedPackages", JSON.stringify(userDownloadedPackages));
            delete localStorage.$wm_userDownloadedPackages;
        }

        MapService.getItemFromLocalStorage("$wm_userDownloadedPackages")
            .then(function (item) {
                userDownloadedPackages = JSON.parse(item.data);
            })
            .catch(function (err) {
                console.warn("$wm_userDownloadedPackages: " + err.message);
                userDownloadedPackages = {};
            });

        var userData = Auth.isLoggedIn() ? Auth.getUserData() : null,
            asyncTranslations = 0,
            asyncRoutes = 0,
            asyncRouteTranslations = 0;

        var modalDownloadScope = $rootScope.$new(),
            modalDownload = {};

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

        //Keep userData updated
        $rootScope.$on('logged-in', function () {
            if (Auth.isLoggedIn()) {
                userData = Auth.getUserData();
            } else {
                userData = null;
            }
        });

        var activatePack = function (data) {
            $http({
                method: 'POST',
                url: communicationConf.baseUrl + communicationConf.endpoint + 'purchase',
                dataType: 'json',
                crossDomain: true,
                data: data,
                headers: {
                    'Content-Type': 'application/json'
                }
            }).success(function (response) {
                for (var i in packagesToActivate) {
                    if (+packagesToActivate[i] === +data.route_id) {
                        packagesToActivate.splice(i, 1);
                        break;
                    }
                }
                localStorage.$wm_packagesToActivate = JSON.stringify(packagesToActivate);
            }).error(function (err) {
            });
        };

        var activatePackages = function () {
            if (!Auth.isLoggedIn()) {
                return;
            }

            userData = Auth.getUserData();
            for (var i in packagesToActivate) {
                var data = {
                    user_id: userData.ID,
                    route_id: packagesToActivate[i]
                };
                activatePack(data);
                userPackagesId[packagesToActivate[i]] = true;
            }

            $rootScope.$emit('userPackagesId-updated', userPackagesId);
            localStorage.$wm_userPackagesId = JSON.stringify(userPackagesId);
        };

        var mergePackages = function (newPackages) {
            var result = {};
            var packId = 0;
            for (var i in newPackages) {
                var packId = newPackages[i].id;
                result[packId] = newPackages[i];
                if (packages[packId]) {
                    result[packId].imgUrl = packages[packId].imgUrl ? packages[packId].imgUrl : "core/images/image-loading.gif";

                    if (packages[packId].localImageUrl) {
                        result[packId].localImageUrl = packages[packId].localImageUrl;
                    }
                }

                if (!result[packId].packageTitle) {
                    result[packId].packageTitle = {};
                }
                result[packId].packageTitle[result[packId].wpml_current_locale.substring(0, 2)] = result[packId].title.rendered;

                if (result[packId].wpml_translations) {
                    for (var p in result[packId].wpml_translations) {
                        var lang = result[packId].wpml_translations[p].locale.substring(0, 2);
                        result[packId].packageTitle[lang] = result[packId].wpml_translations[p].post_title;
                    }
                }

                if (!result[packId].packageDescription) {
                    result[packId].packageDescription = {};
                }
                if (packages[packId] && packages[packId].packageDescription) {
                    result[packId].packageDescription = packages[packId].packageDescription;
                }
                result[packId].packageDescription[result[packId].wpml_current_locale.substring(0, 2)] = result[packId].content.rendered;
            }

            packages = result;
        };

        var getImage = function (packId) {
            if (!packages[packId].imgUrl) {
                packages[packId].imgUrl = "core/images/image-loading.gif";
            }
            Communication.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + 'media/' + packages[packId].featured_media)
                .then(function (data) {
                    if (packages[packId].imgUrl !== data.media_details.sizes.thumbnail.source_url) {
                        packages[packId].imgUrl = data.media_details.sizes.thumbnail.source_url;
                    }

                    Communication.get(packages[packId].imgUrl)
                        .then(function (response) {
                            var imageDownloaded = response;
                            var urlCreator = window.URL || window.webkitURL;

                            packages[packId].localImageUrl = urlCreator.createObjectURL(imageDownloaded);

                            var reader = new FileReader();
                            reader.readAsDataURL(imageDownloaded);
                            reader.onloadend = function () {
                                base64data = reader.result;

                                packages[packId].localImageUrl = base64data;

                                asyncRoutes--;
                                if (asyncRoutes === 0) {
                                    $rootScope.$emit('packages-updated', { packages: packages, loading: false });
                                }
                                else {
                                    $rootScope.$emit('packages-updated', { packages: packages, loading: true });
                                }
                                localStorage.$wm_packages = JSON.stringify(packages);
                            }
                        },
                            function (err) {
                                asyncRoutes--;
                                if (asyncRoutes === 0) {
                                    $rootScope.$emit('packages-updated', { packages: packages, loading: false });
                                }
                                else {
                                    $rootScope.$emit('packages-updated', { packages: packages, loading: true });
                                }
                                console.warn("Error downloading image for " + packId)
                            });

                    localStorage.$wm_packages = JSON.stringify(packages);
                },
                    function (err) {
                        asyncRoutes--;
                        if (asyncRoutes === 0) {
                            $rootScope.$emit('packages-updated', { packages: packages, loading: false });
                        }
                        else {
                            $rootScope.$emit('packages-updated', { packages: packages, loading: true });
                        }
                        console.error('Unable to download images');
                    });
        };

        var getTranslatedRoute = function (id, apiId, lang) {
            $.getJSON(CONFIG.COMMUNICATION.baseUrl + CONFIG.COMMUNICATION.wordPressEndpoint + 'route/' + apiId, function (data) {
                packages[id].packageTitle[lang] = data.title.rendered;
                packages[id].packageDescription[lang] = data.content.rendered;

                asyncRouteTranslations--;
                if (asyncRouteTranslations === 0 && asyncRoutes === 0) {
                    $rootScope.$emit('packages-updated', { packages: packages, loading: false });
                }
                else {
                    $rootScope.$emit('packages-updated', { packages: packages, loading: true });
                }
                localStorage.$wm_packages = JSON.stringify(packages);
            }).fail(function () {
                asyncRouteTranslations--;
                if (asyncRouteTranslations === 0 && asyncRoutes === 0) {
                    $rootScope.$emit('packages-updated', { packages: packages, loading: false });
                }
                else {
                    $rootScope.$emit('packages-updated', { packages: packages, loading: true });
                }
                console.error('Route translation retrive error');
            });
        };

        var getTaxonomyTranslated = function (taxonomyType, id, lang) {
            Communication.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + taxonomyType + '/' + id + '?lang=' + lang)
                .then(function (data) {
                    taxonomy[taxonomyType][id].name[lang] = data.name;
                    taxonomy[taxonomyType][id].description[lang] = data.description;

                    asyncTranslations--;
                    if (asyncTranslations === 0) {
                        $rootScope.$emit('taxonomy-' + taxonomyType + '-updated', { taxonomy: taxonomy[taxonomyType], loading: false });
                    }
                    else {
                        $rootScope.$emit('taxonomy-' + taxonomyType + '-updated', { taxonomy: taxonomy[taxonomyType], loading: true });
                    }
                    localStorage.$wm_taxonomy = JSON.stringify(taxonomy);
                })
                .catch(function (err) {
                    asyncTranslations--;
                    if (asyncTranslations === 0) {
                        $rootScope.$emit('taxonomy-' + taxonomyType + '-updated', { taxonomy: taxonomy[taxonomyType], loading: false });
                    }
                    console.warn("Unable to update taxonomy. Using local data")
                });
        };

        /**
         * @description
         * Update the packages and the categories list and
         * Emit the updated lists
         *
         * @event packages-updated
         */
        packageService.getRoutes = function (forceUpdate) {
            //Prevent multiple requests
            if (forceUpdate) {
                updated.packages = false;
            }

            if (updated.packages) {
                $rootScope.$emit('packages-updated', { packages: packages, loading: asyncRoutes > 0 || asyncTranslations > 0 });
                return;
            }

            updated.packages = true;

            if (packages) {
                $rootScope.$emit('packages-updated', { packages: packages, loading: true });
            }

            Communication.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + 'route/?per_page=100')
                .then(function (data) {
                    if (!packages) {
                        packages = {};
                    }

                    mergePackages(data);

                    asyncRoutes = 0;
                    asyncRouteTranslations = 0;

                    for (var i in packages) {
                        asyncRoutes++;
                        getImage(i);
                        for (var j in packages[i].wpml_translations) {
                            asyncRouteTranslations++;
                            getTranslatedRoute(i, packages[i].wpml_translations[j].id, packages[i].wpml_translations[j].locale.substring(0, 2));
                        }
                    }

                    if (asyncRoutes === 0) {
                        $rootScope.$emit('packages-updated', { packages: packages, loading: false });
                    }
                    else {
                        $rootScope.$emit('packages-updated', { packages: packages, loading: true });
                    }

                    localStorage.$wm_packages = JSON.stringify(packages);
                },
                    function (err) {
                        if (!packages) {
                            console.warn("No routes available. Restart the app with an open connection");
                        }
                    });
        };

        /**
         * @description
         * Emit taxonomy of type [taxonomyType] updated
         *
         * @event taxonomy-[taxonomyType]-updated
         *
         * @param {string} taxonomyType
         *      the type of taxonomy to update
         */
        packageService.getTaxonomy = function (taxonomyType, forceUpdate) {
            if (forceUpdate) {
                updated.taxonomy[taxonomyType] = false;
            }

            if (updated.taxonomy[taxonomyType]) {
                $rootScope.$emit('taxonomy-' + taxonomyType + '-updated', { taxonomy: taxonomy[taxonomyType], loading: asyncTranslations !== 0 });
                return;
            }

            updated.taxonomy[taxonomyType] = true;

            if (taxonomy[taxonomyType]) {
                $rootScope.$emit('taxonomy-' + taxonomyType + '-updated', { taxonomy: taxonomy[taxonomyType], loading: true });
            }

            Communication.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + taxonomyType + '?per_page=100')
                .then(function (data) {
                    asyncTranslations = 0;
                    taxonomy[taxonomyType] = {};
                    for (var i in data) {
                        if (data[i].count > 0) {
                            taxonomy[taxonomyType][data[i].id] = data[i];
                            if (CONFIG.LANGUAGES) {
                                var tmpName = taxonomy[taxonomyType][data[i].id].name;
                                taxonomy[taxonomyType][data[i].id].name = {};
                                taxonomy[taxonomyType][data[i].id].name[defaultLang] = tmpName;
                                delete tmpName;

                                var tmpDescription = taxonomy[taxonomyType][data[i].id].description;
                                taxonomy[taxonomyType][data[i].id].description = {};
                                taxonomy[taxonomyType][data[i].id].description[defaultLang] = tmpDescription;
                                delete tmpDescription;

                                if (CONFIG.LANGUAGES.available) {
                                    for (var langId in CONFIG.LANGUAGES.available) {
                                        asyncTranslations++;
                                        getTaxonomyTranslated(taxonomyType, data[i].id, CONFIG.LANGUAGES.available[langId]);
                                    }
                                }
                            }
                        }
                    }

                    if (asyncTranslations === 0) {
                        $rootScope.$emit('taxonomy-' + taxonomyType + '-updated', { taxonomy: taxonomy[taxonomyType], loading: false });
                    }
                    else {
                        $rootScope.$emit('taxonomy-' + taxonomyType + '-updated', { taxonomy: taxonomy[taxonomyType], loading: true });
                    }
                    localStorage.$wm_taxonomy = JSON.stringify(taxonomy);
                })
                .catch(function (err) {
                    if (!taxonomy[taxonomyType]) {
                        console.warn("No taxonomy " + taxonomyType);
                        return;
                    }
                });
        };

        /**
         * @description
         * Get the list of packages allowed to a specific user and
         * Emit the updated list of available packages
         *
         * @event userPackagesId-updated
         *
         */
        packageService.getPackagesIdByUserId = function () {
            userData = Auth.getUserData();
            if (!userData || !userData.ID) {
                userPackagesId = {};
                $rootScope.$emit('userPackagesId-updated', {});
                return;
            }

            if (userPackagesId) {
                $rootScope.$emit('userPackagesId-updated', userPackagesId);
            }
            Communication.getJSON(communicationConf.baseUrl + communicationConf.endpoint + 'route_id/' + userData.ID)
                .then(function (data) {
                    userPackagesId = {};

                    for (var key in data) {
                        userPackagesId[key] = true;
                    }

                    $rootScope.$emit('userPackagesId-updated', userPackagesId);
                    localStorage.$wm_userPackagesId = JSON.stringify(userPackagesId);
                },
                    function (err) {
                        if (!userPackagesId) {
                            console.warn("No userPackagesId available. Shutting down...");
                        }
                    });
        };

        /**
         * @description
         * Use a voucher to get permission to download a route and
         * Emit the new list of available packages
         *
         * @event userPackagesId-updated
         *
         * @param {number} packId
         *      the id of the pack to request
         *
         */
        packageService.useVoucher = function (packId) {
            userData = Auth.getUserData();
            if (!userData || !userData.ID) {
                return;
            }

            $ionicPopup.prompt({
                title: $translate.instant('Codice Viaggio'),
                subTitle: $translate.instant('Inserisci il codice del tuo pacchetto di viaggio'),
                inputType: 'text',
                inputPlaceholder: $translate.instant('Codice Viaggio')
            }).then(function (res) {
                if (res) {
                    var data = $.param({
                        route_id: packId,
                        user_id: userData.ID,
                        code: res
                    });

                    var config = {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
                        }
                    }

                    $ionicLoading.show({
                        template: '<ion-spinner></ion-spinner>'
                    });

                    $http.post(
                        CONFIG.COMMUNICATION.baseUrl + CONFIG.COMMUNICATION.endpoint + 'voucher',
                        data,
                        config
                    )
                        .success(function (data, status, headers, config) {
                            $ionicLoading.hide();
                            ///Update offline data
                            userPackagesId[packId] = true;
                            localStorage.$wm_userPackagesId = JSON.stringify(userPackagesId);
                        })
                        .error(function (data, status, header, config) {
                            $ionicLoading.hide();
                            if (data.error === "Voucher Expired") {
                                $ionicPopup.alert({
                                    template: $translate.instant("Il codice di viaggio che hai utilizzato è scaduto")
                                });
                            } else {
                                $ionicPopup.alert({
                                    template: $translate.instant("Il codice di viaggio che hai inserito non è valido. Controlla di averlo inserito correttamente e inseriscilo nuovamente.")
                                });
                            }
                        });
                }
            });
        };

        /**
         * @description
         * Buy the package via in-app purchase and
         * Emit the new list of available packages
         *
         * @event userPackagesId-updated
         *
         * @param {number} packId
         *      the id of the pack to buy
         */
        packageService.buyPack = function (packId) {
            $ionicLoading.show();
            userData = Auth.getUserData();
            if (!userData || !userData.ID) {
                return;
            }
            var productId = CONFIG.appId + '.' + packId;

            inAppPurchase.getProducts([productId])
                .then(function (product) {
                    $ionicLoading.hide();
                    if (product[0]) {
                        product = product[0];
                    }

                    if (product && product.productId) {
                        inAppPurchase.buy(product.productId)
                            .then((res) => {
                                var data = {
                                    user_id: userData.ID,
                                    route_id: packId
                                };

                                userPackagesId[packId] = true;
                                $rootScope.$emit('userPackagesId-updated', userPackagesId);
                                localStorage.$wm_userPackagesId = JSON.stringify(userPackagesId);

                                activatePack(data);
                            })
                            .catch((err) => {
                                console.warn(err)
                                var code = err.code ? err.code : (err.errorCode ? err.errorCode : -1);
                                switch (code) {
                                    case -5:
                                        //User cancelled
                                        break;
                                    case -8:
                                        //item unavailable
                                        $ionicPopup.alert({
                                            title: $translate.instant("ATTENZIONE"),
                                            template: $translate.instant("Questo prodotto non è al momento disponibile")
                                        });
                                        break;
                                    case -9:
                                        //item already owned
                                        $ionicPopup.alert({
                                            title: $translate.instant("ATTENZIONE"),
                                            template: $translate.instant("Hai già acquistato questo prodotto in precedenza: per te sarà disponibile da subito senza ulteriori spese")
                                        });

                                        var data = {
                                            user_id: userData.ID,
                                            route_id: packId
                                        };

                                        userPackagesId[packId] = true;
                                        $rootScope.$emit('userPackagesId-updated', userPackagesId);
                                        localStorage.$wm_userPackagesId = JSON.stringify(userPackagesId);

                                        activatePack(data);
                                        break;
                                    default:
                                        $ionicPopup.alert({
                                            title: $translate.instant("ATTENZIONE"),
                                            template: $translate.instant("Si è verificato un errore. Riprova")
                                        });
                                        break;
                                }
                            });
                    }
                    else {
                        $ionicPopup.alert({
                            title: $translate.instant("ATTENZIONE"),
                            template: $translate.instant("Questo prodotto non è al momento disponibile")
                        });
                    }
                })
                .catch(function (err) {
                    $ionicLoading.hide();
                    console.err(err);
                    var code = err.code ? err.code : (err.errorCode ? err.errorCode : -1);
                    $ionicPopup.alert({
                        title: $translate.instant("ATTENZIONE"),
                        template: $translate.instant("Si è verificato un errore. Riprova") + "<br>Error " + code
                    });
                });
        };

        /**
         * @description
         * Restore the purchases and
         * Emit the new list of purchased packages
         *
         * @event userPackagesId-updated
         *
         */
        packageService.restorePurchases = function () {
            $ionicLoading.show();
            inAppPurchase.restorePurchases()
                .then(function (purchases) {
                    for (var i in purchases) {
                        var id = purchases[i].productId.split('.');
                        id = id.pop();
                        if (!userPackagesId[id]) {
                            userPackagesId[id] = true;
                            packagesToActivate.push(id);
                        }
                    }
                    $ionicLoading.hide();

                    $ionicPopup.alert({
                        title: $translate.instant("ATTENZIONE"),
                        template: $translate.instant("Tutti gli acquisti sono stati ripristinati correttamente")
                    });

                    $rootScope.$emit('userPackagesId-updated', userPackagesId);
                    localStorage.$wm_userPackagesId = JSON.stringify(userPackagesId);
                    localStorage.$wm_packagesToActivate = JSON.stringify(packagesToActivate);
                    activatePackages();
                })
                .catch(function (err) {
                    $ionicLoading.hide();
                    $ionicPopup.alert({
                        title: $translate.instant("ATTENZIONE"),
                        template: $translate.instant("Si è verificato un errore. Controlla di essere connesso e riprova")
                    });
                    console.log("Error restoring purchases", err);
                });
        };

        /**
         * @description
         * Download the requested package and
         * emit the new list of downloaded packages
         *
         * @event userDownloadedPackages-updated
         *
         * @param {number} packId
         *      the id of the pack to download
         */
        packageService.downloadPackage = function (packId) {
            $ionicPopup.confirm({
                title: $translate.instant("ATTENZIONE"),
                template: $translate.instant("Stai per scaricare l'itinerario sul dispositivo, vuoi procedere?")
            })
                .then(function (res) {
                    if (res) {
                        $.ajaxSetup({
                            cache: false
                        });
                        modalDownload.show();
                        Communication.getJSON(communicationConf.downloadJSONUrl + packId + '/app.json')
                            .then(function (data) {
                                var arrayLink = [];

                                var downloadSuccess = function () {
                                    modalDownload.hide();
                                    userDownloadedPackages[packId] = true;
                                    $rootScope.$emit('userDownloadedPackages-updated', userDownloadedPackages);
                                    MapService.setItemInLocalStorage("$wm_userDownloadedPackages", JSON.stringify(userDownloadedPackages));
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

                                Offline
                                    .downloadUserMap(packId, arrayLink, modalDownloadScope.vm)
                                    .then(downloadSuccess, downloadFail);

                                $.ajaxSetup();
                            },
                                function () {
                                    // TODO: add ionic alert
                                    modalDownload.hide();
                                    alert($translate.instant("Si è verificato un errore nello scaricamento del pacchetto, assicurati di essere online e riprova"));
                                });
                    }
                });
        };

        /**
         * @description
         * Method to open a package already downloaded
         *
         * @param {number} packId
         *      the id of the pack to open
         */
        packageService.openPackage = function (packId) {
            var basePackUrl = Offline.getOfflineMhildBasePathById(packId);

            Communication.getLocalFile(basePackUrl + 'config.json')
                .then(function (data) {
                    localStorage.$wm_mhildConf = data;
                    localStorage.$wm_mhildBaseUrl = Offline.getOfflineMhildBasePathById(packId);
                    localStorage.$wm_mhildId = packId;

                    sessionStorage.$wm_doBack = 'allowed';

                    $ionicLoading.show({
                        template: '<ion-spinner></ion-spinner>'
                    });

                    location.reload();
                    Utils.forceDigest();
                });
        };

        /**
         * @description
         * Delete a package already downloaded and
         * Emit the updated list of downloaded packages
         *
         * @event userDownloadedPackages-updated
         *
         * @param {number} packId
         *      the id of the pack to remove from storage
         */
        packageService.removePack = function (packId) {
            $ionicPopup.confirm({
                title: $translate.instant("ATTENZIONE"),
                template: $translate.instant("Stai per rimuovere l'itinerario dal dispositivo, vuoi procedere?<br />") + $translate.instant("Questo itinerario è riservato ai clienti Verde Natura che hanno acquistato questo viaggio. Terminata la fase di sperimentazione, gli itinerari saranno disponibili a tutti")
            })
                .then(function (res) {
                    if (res) {
                        Offline.removePackById(packId);
                        delete userDownloadedPackages[packId];
                        $rootScope.$emit('userDownloadedPackages-updated', userDownloadedPackages);
                        MapService.setItemInLocalStorage("$wm_userDownloadedPackages", JSON.stringify(userDownloadedPackages));
                    }
                });
        };

        /**
         * @description
         * Emit the updated list of downloaded packages
         * and return it
         *
         * @event userDownloadedPackages-updated
         *
         */
        packageService.getDownloadedPackages = function () {
            $rootScope.$emit('userDownloadedPackages-updated', userDownloadedPackages);
            return userDownloadedPackages;
        };

        activatePackages();

        return packageService;
    });
