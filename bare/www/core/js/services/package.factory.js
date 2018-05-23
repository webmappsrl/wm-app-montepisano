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
        $q,
        $rootScope,
        $ionicLoading,
        $ionicModal,
        $ionicPopup,
        $translate,
        CONFIG,
        Auth,
        Communication,
        Offline,
        Utils
    ) {
        var packageService = {};

        var communicationConf = CONFIG.COMMUNICATION,
            currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : 'it',
            defaultLang = (CONFIG.LANGUAGE && CONFIG.LANGUAGE.actual) ? CONFIG.LANGUAGE.actual.substring(0, 2) : 'it';

        var packages = localStorage.$wm_packages ? JSON.parse(localStorage.$wm_packages) : null,
            userPackagesId = localStorage.$wm_userPackagesId ? JSON.parse(localStorage.$wm_userPackagesId) : null,
            userDownloadedPackages = localStorage.$wm_userDownloadedPackages ? JSON.parse(localStorage.$wm_userDownloadedPackages) : {},
            userPackagesIdRquested = localStorage.$wm_userPackagesIdRquested ? JSON.parse(localStorage.$wm_userPackagesIdRquested) : {},
            categories = localStorage.$wm_categories ? JSON.parse(localStorage.$wm_categories) : null,
            taxonomy = localStorage.$wm_taxonomy ? JSON.parse(localStorage.$wm_taxonomy) : {
                activity: null,
                theme: null,
                when: null,
                where: null,
                who: null
            };

        var userData = Auth.isLoggedIn() ? Auth.getUserData() : null,
            asyncTranslations = 0,
            asyncRoutes = 0;

        var modalScope = $rootScope.$new(),
            modal = {},
            modalDownloadScope = $rootScope.$new(),
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

                result[packId].packageTitle = {};
                result[packId].packageTitle[defaultLang] = result[packId].title.rendered;

                if (result[packId].wpml_translations) {
                    for (var p in result[packId].wpml_translations) {
                        var lang = result[packId].wpml_translations[p].locale.substring(0, 2);
                        result[packId].packageTitle[lang] = result[packId].wpml_translations[p].post_title;
                    }
                }
            }

            packages = result;
        };

        var getImage = function (packId) {
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
                                    $rootScope.$emit('packages-updated', packages);
                                }
                                localStorage.$wm_packages = JSON.stringify(packages);
                            }
                        },
                            function (err) {
                                asyncRoutes--;
                                if (asyncRoutes === 0) {
                                    $rootScope.$emit('packages-updated', packages);
                                }
                                console.log("Error downloading image for " + packId)
                            });

                    // asyncRoutes--;
                    // if (asyncRoutes === 0) {
                    //     $rootScope.$emit('packages-updated', packages);
                    // }
                    localStorage.$wm_packages = JSON.stringify(packages);
                },
                    function (err) {
                        asyncRoutes--;
                        if (asyncRoutes === 0) {
                            $rootScope.$emit('packages-updated', packages);
                        }
                        console.error('images retrive error');
                    });
        };

        var getTaxonomyTranslated = function (taxonomyType, id, lang) {
            Communication.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + taxonomyType + '/' + id + '?lang=' + lang)
                .then(function (data) {
                    taxonomy[taxonomyType][id].name[lang] = data.name;
                    taxonomy[taxonomyType][id].description[lang] = data.description;

                    asyncTranslations--;
                    if (asyncTranslations === 0) {
                        $rootScope.$emit('taxonomy-' + taxonomyType + '-updated', taxonomy[taxonomyType]);
                        localStorage.$wm_taxonomy = JSON.stringify(taxonomy);
                    }
                })
                .catch(function (err) {
                    asyncTranslations--;
                    if (asyncTranslations === 0) {
                        $rootScope.$emit('taxonomy-' + taxonomyType + '-updated', taxonomy[taxonomyType]);
                    }
                });
        };

        /**
         * @description
         * Update the packages and the categories list and
         * Emit the updated lists
         * 
         * @event packages-updated
         * @event categories-updated
         */
        packageService.getRoutes = function () {
            //Prevent multiple requests
            if (asyncRoutes > 0) {
                $rootScope.$emit('packages-updated', packages);
                return;
            }

            if (packages) {
                $rootScope.$emit('packages-updated', packages);
            }

            Communication.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + 'route/?per_page=100')
                .then(function (data) {
                    if (!packages) {
                        packages = {};
                    }

                    mergePackages(data);

                    asyncRoutes = 0;

                    for (var i in packages) {
                        asyncRoutes++;
                        getImage(i);
                    }

                    if (asyncRoutes === 0) {
                        $rootScope.$emit('packages-updated', packages);
                    }
                    localStorage.$wm_packages = JSON.stringify(packages);
                },
                    function (err) {
                        if (!packages) {
                            console.warn("No routes available. Restart the app with an open connection. Shutting down the app...");
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
        packageService.getTaxonomy = function (taxonomyType) {
            if (taxonomy[taxonomyType]) {
                $rootScope.$emit('taxonomy-' + taxonomyType + '-updated', taxonomy[taxonomyType]);
            }
            else {
                taxonomy[taxonomyType] = localStorage.$wm_taxonomy ? JSON.parse(localStorage.$wm_taxonomy)[taxonomyType] : null;
                if (taxonomy[taxonomyType]) {
                    $rootScope.$emit('taxonomy-' + taxonomyType + '-updated', taxonomy[taxonomyType]);
                }
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
                        $rootScope.$emit('taxonomy-' + taxonomyType + '-updated', taxonomy[taxonomyType]);
                    }
                    localStorage.$wm_taxonomy = JSON.stringify(taxonomy);
                })
                .catch(function (err) {
                    if (!taxonomy[taxonomyType]) {
                        //Popup connection not available
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
            if (!userData || !userData.ID) {
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
         * Request the package and
         * Emit the new list of requested packages
         * 
         * @event userPackagesIdRquested-updated
         * 
         * @param {number} packId 
         *      the id of the pack to request
         */
        packageService.requestPack = function (packId) {
            if (!userData || !userData.ID || userPackagesIdRquested[packId]) {
                return;
            }
            $ionicPopup
                .confirm({
                    title: $translate.instant("ATTENZIONE"),
                    template: $translate.instant("Stai per richiedere l'accesso al download dell'itinerario, riceverai una e-mail con le istruzioni per procedere all'acquisto. Vuoi procedere?")
                })
                .then(function (res) {
                    if (res) {
                        var data = {
                            email: userData.user_email,
                            pack: packId,
                            appname: CONFIG.OPTIONS.title
                        };

                        $ionicLoading.show();

                        $http({
                            method: 'POST',
                            url: communicationConf.baseUrl + communicationConf.endpoint + 'mail',
                            dataType: 'json',
                            crossDomain: true,
                            data: data,
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }).success(function (data) {
                            $ionicPopup.alert({
                                template: $translate.instant("La richiesta è stata inviata, ti è stata spedita una e-mail con le istruzioni per procedere con l'acquisto.")
                            });
                            userPackagesIdRquested[packId] = true;
                            $rootScope.$emit('userPackagesIdRquested-updated', userPackagesIdRquested);
                            localStorage.$wm_userPackagesIdRquested = JSON.stringify(userPackagesIdRquested);
                            $ionicLoading.hide();
                        }).error(function (error) {
                            $ionicPopup.alert({
                                template: $translate.instant("Si è verificato un errore durante la richiesta, riprova")
                            });
                            $ionicLoading.hide();
                            console.error(error);
                        });
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
        packageService.requestPackageWithVoucher = function (packId) {
            if (!userData || !userData.ID) {
                return;
            }

            $ionicPopup.prompt({
                title: $translate.instant('Voucher'),
                subTitle: $translate.instant('Inserisci il voucher da attivare'),
                inputType: 'text',
                inputPlaceholder: $translate.instant('Voucher')
            })
                .then(function (res) {
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

                        $ionicLoading.show();

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
        packageService.downloadPack = function (packId) {
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
                                    localStorage.$wm_userDownloadedPackages = JSON.stringify(userDownloadedPackages);
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

                    $ionicLoading.show();

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
            return $ionicPopup.confirm({
                title: $translate.instant("ATTENZIONE"),
                template: $translate.instant("Stai per rimuovere l'itinerario dal dispositivo, vuoi procedere?<br />") + $translate.instant("Questo itinerario è riservato ai clienti Verde Natura che hanno acquistato questo viaggio. Terminata la fase di sperimentazione, gli itinerari saranno disponibili a tutti")
            })
                .then(function (res) {
                    if (res) {
                        Offline.removePackById(packId);
                        delete userDownloadedPackages[packId];
                        $rootScope.$emit('userDownloadedPackages-updated', userDownloadedPackages);
                        localStorage.$wm_userDownloadedPackages = JSON.stringify(userDownloadedPackages);
                    }
                });
        };

        /**
         * @description
         * Delete and re-download a package already downloaded
         * 
         * @event userDownloadedPackages-updated
         * 
         * @param {number} packId 
         *      the id of the pack to update
         */
        packageService.updatePack = function (packId) {
            Offline.removePackById(packId);
            delete userDownloadedPackages[packId];
            $rootScope.$emit('userDownloadedPackages-updated', userDownloadedPackages);
            localStorage.$wm_userDownloadedPackages = JSON.stringify(userDownloadedPackages);
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
                        localStorage.$wm_userDownloadedPackages = JSON.stringify(userDownloadedPackages);
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

        return packageService;
    });