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
        vm.taxonomyRoutes = localStorage.$wm_taxonomyRoutes ? JSON.parse(localStorage.$wm_taxonomyRoutes) : {};
        vm.routes = {};
        vm.fullDescription = false;
        vm.activities = localStorage.$wm_activities ? JSON.parse(localStorage.$wm_activities) : {};

        var taxonomyType = $state.params.parentId,
            id = $state.params.id * 1; // * 1 is to make id integrer

        var setActivities = function () {
            var getActivity = function (activityId) {};

            vm.activities = localStorage.$wm_activities ? JSON.parse(localStorage.$wm_activities) : {};

            if (vm.taxonomyRoutes && vm.taxonomyRoutes[taxonomyType]) {
                for (var i in vm.taxonomyRoutes[taxonomyType][id]) {
                    for (var j in vm.taxonomyRoutes[taxonomyType][id][i].activity) {
                        if (!vm.activities[vm.taxonomyRoutes[taxonomyType][id][i].activity[j]]) {
                            vm.activities[vm.taxonomyRoutes[taxonomyType][id][i].activity[j]] = {
                                icon: 'wm-icon-help-circled'
                            };
                        }
                    }
                }
            }

            $.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + 'activity?per_page=100', function (data) {
                for (var i in data) {
                    vm.activities[data[i].id] = data[i];
                }

                localStorage.$wm_activities = JSON.stringify(vm.activities);
                Utils.forceDigest();
            }).fail(function (err) {
                console.log("Error retrieving activities")
            });
        };

        var setItem = function (itemToSet) {
            vm.item = itemToSet
            vm.title = vm.item.name;

            vm.taxonomyRoutes = localStorage.$wm_taxonomyRoutes ? JSON.parse(localStorage.$wm_taxonomyRoutes) : {};

            console.log(vm.taxonomyRoutes);

            if (vm.taxonomyRoutes && vm.taxonomyRoutes[taxonomyType] && vm.taxonomyRoutes[taxonomyType][id]) {
                vm.routes = vm.taxonomyRoutes[taxonomyType][id];
                setActivities();
                Utils.forceDigest();
            }

            $.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + 'route?' + taxonomyType + '=' + id, function (data) {
                var routesTemp = {};
                for (var i in data) {
                    routesTemp[data[i].id] = data[i];
                }
                vm.routes = routesTemp;

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

                console.log(vm.routes);
                setActivities();
                Utils.forceDigest();
            }).fail(function () {
                if (!vm.routes.length) {
                    console.log("Unable to get routes")
                } else {
                    setActivities();
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
            setTimeout(function() {
                $(window).trigger('resize');
                Utils.forceDigest();
            }, 100);
        };

        vm.downloadPack = function (routeId) {
            var pack = vm.routes[routeId];
            // console.log(pack);
            // return;
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

                        $.ajaxSetup({
                            cache: false
                        });
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

                            $.ajaxSetup();
                        }).fail(function () {
                            // TODO: add ionic alert
                            alert($translate.instant("Si è verificato un errore nello scaricamento del pacchetto, assicurati di essere online e riprova"));
                        });
                    }
                });
        };

        getTaxonomyDetails();
        return vm;
    });