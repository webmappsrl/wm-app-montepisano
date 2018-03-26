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

        var userData = Auth.getUserData();

        var modalDownloadScope = $rootScope.$new(),
            modalDownload = {};

        modalDownloadScope.vm = {};
        modalDownloadScope.vm.hide = function () {
            modalDownload && modalDownload.hide();
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

                                        $rootScope.$emit('packages-updated', packages);
                                        localStorage.$wm_packages = JSON.stringify(packages);
                                    }
                                },
                                function (err) {
                                    console.log("Error downloading image for " + packId)
                                });

                        $rootScope.$emit('packages-updated', packages);
                        localStorage.$wm_packages = JSON.stringify(packages);
                    },
                    function (err) {
                        console.error('images retrive error');
                    });
        };

        var translateCategory = function (categoryId, lang) {
            Communication.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + 'webmapp_category/' + categoryId + "?lang=" + lang)
                .then(function (data) {
                        categories[categoryId].name[lang] = data.name;
                        $rootScope.$emit('categories-updated', categories);
                        localStorage.$wm_categories = JSON.stringify(categories);
                    },
                    function () {
                        console.error('Translations retrive error');
                    });
        };

        var getCategories = function () {
            Communication.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + 'webmapp_category?per_page=100')
                .then(function (data) {
                        categories = {};

                        for (var packId in packages) {
                            for (var i in packages[packId].webmapp_category) {
                                var categoryId = packages[packId].webmapp_category[i];
                                if (!categories || !categories[categoryId]) {
                                    categories[categoryId] = {
                                        name: {},
                                        icon: 'wm-icon-generic'
                                    };
                                }
                            }
                        }

                        for (var pos in data) {
                            if (categories[data[pos].id]) {
                                categories[data[pos].id].name[defaultLang] = data[pos].name;
                                if (data[pos].icon && data[pos].icon !== 'wm-icon-generic') {
                                    categories[data[pos].id].icon = data[pos].icon;
                                }
                                if (CONFIG.LANGUAGES && CONFIG.LANGUAGES.available) {
                                    for (var i in CONFIG.LANGUAGES.available) {
                                        translateCategory(data[pos].id, CONFIG.LANGUAGES.available[i].substring(0, 2));
                                    }
                                }
                            }
                        }

                        $rootScope.$emit('categories-updated', categories);
                        localStorage.$wm_categories = JSON.stringify(categories);
                    },
                    function (error) {
                        if (!categories.length) {
                            console.warn("No categories available. Shutting down...");
                        }
                    });
            if (!categories) {
                $ionicLoading.show();
            }
            $rootScope.$emit('categories-updated', categories);
        };

        /**
         * @description
         * Update the packages list and
         * Emit the packages updated
         * 
         * @event packages-updated
         */
        packageService.getRoutes = function () {
            Communication.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + 'route/?per_page=100')
                .then(function (data) {
                        if (!packages) {
                            packages = {};
                        }

                        mergePackages(data);

                        for (var i in packages) {
                            getImage(i);
                        }

                        localStorage.$wm_packages = JSON.stringify(packages);

                        getCategories();
                        $rootScope.$emit('packages-updated', packages);
                        $ionicLoading.hide();
                    },
                    function (err) {
                        if (!packages) {
                            console.warn("No routes available. Restart the app with an open connection. Shutting down the app...");
                        }
                        $ionicLoading.hide();
                    });

            if (!packages) {
                $ionicLoading.show();
            }
            $rootScope.$emit('packages-updated', packages);
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
            Communication.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + taxonomyType + '?per_page=100')
                .then(function (data) {
                    taxonomy[taxonomyType] = {};
                    for (var i in data) {
                        if (data[i].count > 0) {
                            taxonomy[taxonomyType][data[i].id] = data[i];
                        }
                    }

                    $rootScope.$emit('taxonomy-' + taxonomyType + '-updated', taxonomy[taxonomyType]);
                    localStorage.$wm_taxonomy = JSON.stringify(taxonomy);

                    $ionicLoading.hide();
                })
                .catch(function (err) {
                    if (!taxonomy[taxonomyType]) {
                        $ionicLoading.hide();
                        //Popup connection not available
                        console.warn("No taxonomy " + taxonomyType);
                        return;
                    }
                });

            if (!taxonomy[taxonomyType]) {
                $ionicLoading.show();
            }
            $rootScope.$emit('taxonomy-' + taxonomyType + '-updated', taxonomy[taxonomyType]);
        };

        /**
         * @description
         * Get the list of packages allowed to a specific user and
         * Emit the updated list of available packages
         * 
         * @event userPackagesId-updated
         * 
         * @param {number} userId
         *      the id of the user to get the list of available packages
         */
        packageService.getPackagesIdByUserId = function (userId) {
            userData = Auth.getUserData();
            if (!userData || !userData.ID) {
                return {};
            }
            Communication.getJSON(communicationConf.baseUrl + communicationConf.endpoint + 'route_id/' + userId)
                .then(function (data) {
                        userPackagesId = {};

                        for (var key in data) {
                            userPackagesId[key] = true;
                        }

                        $rootScope.$emit('userPackagesId-updated', userPackagesId);
                        $ionicLoading.hide();
                        localStorage.$wm_userPackagesId = JSON.stringify(userPackagesId);
                    },
                    function (err) {
                        if (!userPackagesId.length) {
                            console.warn("No userPackagesId available. Shutting down...");
                        }
                        $ionicLoading.hide();
                    });

            if (!userPackagesId) {
                $ionicLoading.show();
            }
            $rootScope.$emit('userPackagesId-updated', userPackagesId);
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
            userData = Auth.getUserData();
            if (!userData || !userData.ID || userPackagesIdRquested[packId]) {
                return;
            }
            $ionicPopup
                .confirm({
                    title: $translate.instant("ATTENZIONE"),
                    template: $translate.instant("Stai per richiedere accesso al download dell'itinerario, intendi proseguire?")
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
                                template: $translate.instant("La richiesta è stata inviata, verrà processata al più presto")
                            });
                            userPackagesIdRquested[packId] = true;
                            $rootScope.$emit('userPackagesIdRquested-updated', userPackagesIdRquested);
                            localStorage.$wm_userPackagesIdRquested = JSON.stringify(vm.userPackagesIdRquested);
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

                                    modalDownload.show();

                                    Offline
                                        .downloadUserMap(packId, arrayLink, modalDownloadScope.vm)
                                        .then(downloadSuccess, downloadFail);

                                    $.ajaxSetup();
                                },
                                function () {
                                    // TODO: add ionic alert
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
            $ionicPopup.confirm({
                    title: $translate.instant("ATTENZIONE"),
                    template: $translate.instant("Stai per rimuovere l'itinerario dal dispositivo, vuoi procedere?<br />") + $translate.instant("Questo itinerario è riservato ai clienti Verde Natura che hanno acquistato questo viaggio. Terminata la fase di sperimentazione, gli itinerari saranno disponibili a tutti")
                })
                .then(function (res) {
                    if (res) {
                        Offline.removePackById(packId);
                        delete userDownloadedPackages[packId];
                        $rootScope.$emit('userDownloadedPackages-updated', userDownloadedPackages);
                        localStorage.$wm_userDownloadedPackages = JSON.stringify(vm.userDownloadedPackages);
                    }
                });
        };

        return packageService;
    });