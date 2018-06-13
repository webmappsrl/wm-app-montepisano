angular.module('webmapp')

    .controller('DetailTaxonomyController', function DetailTaxonomyController(
        $ionicLoading,
        $ionicPopup,
        $rootScope,
        $scope,
        $state,
        $translate,
        Communication,
        CONFIG,
        MapService,
        PackageService,
        Utils
    ) {
        var vm = {};

        vm.title = CONFIG.OPTIONS.title;
        var communicationConf = CONFIG.COMMUNICATION;

        vm.colors = CONFIG.MAIN ? CONFIG.MAIN.STYLE : CONFIG.STYLE;

        vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";
        vm.defaultLang = CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual ? CONFIG.LANGUAGES.actual : 'it';
        vm.taxonomy = {};
        vm.item = {};
        vm.routes = {};
        vm.tracks = {};
        vm.activities = {};
        vm.userDownloadedPackages = {};

        vm.fullDescription = false;

        var registeredEvents = [];

        if (CONFIG.MAIN) {
            Utils.goTo("/");
            var timeoutFunction = function () {
                if (MapService.isReady()) {
                    $ionicLoading.hide();
                    // Utils.goTo("layer/Tappe/801");
                    Utils.goTo(CONFIG.OPTIONS.startUrl);
                } else {
                    setTimeout(timeoutFunction, 300);
                }
            };
            $ionicLoading.show();
            timeoutFunction();
            return vm;
        }

        var taxonomyType = $state.params.parentId,
            id = $state.params.id * 1; // * 1 is to make id integrer

        var forceDigest = function () {
            setTimeout(function () {
                $(window).trigger('resize');
                Utils.forceDigest();
            }, 100);
        };

        vm.toggleDescription = function () {
            vm.fullDescription = !vm.fullDescription;
            forceDigest();
        };

        vm.openOrDownloadPack = function (packId) {
            if (vm.userDownloadedPackages[packId]) {
                localStorage.$wm_itemColor = JSON.stringify(vm.item.color);
                localStorage.$wm_activityIcon = JSON.stringify(vm.activities[vm.routes[packId].activity[0]].icon);

                if (vm.item.name[vm.currentLang]) {
                    localStorage.$wm_taxonomyName = JSON.stringify(vm.item.name[vm.currentLang]);
                }
                else if (typeof (vm.item.name) === String) {
                    localStorage.$wm_taxonomyName = JSON.stringify(vm.item.name);
                }
                else {
                    localStorage.$wm_taxonomyName = JSON.stringify(vm.item.name[Object.keys(vm.item.name)[0]]);
                }

                if (!vm.routes[packId].lastDownload || vm.routes[packId].lastDownload !== vm.routes[packId].modified) {
                    $ionicPopup.confirm({
                        title: $translate.instant("ATTENZIONE"),
                        template: $translate.instant("È disponibile un update dell'itinerario, vuoi scaricarlo ora?")
                    })
                        .then(function (res) {
                            if (res) {
                                PackageService.updatePack(packId);
                            }
                            else {
                                PackageService.openPackage(packId);
                            }
                        });
                }
                else {
                    PackageService.openPackage(packId);
                }
            } else {
                PackageService.downloadPack(packId);
            }
        };

        vm.toggleList = function () {
            vm.isListExpanded = !vm.isListExpanded;
            $rootScope.$emit('toggle-list', vm.isListExpanded);
        };

        var updateMapView = function () {
            MapService.resetLayers();
            MapService.disableInteractions();
            var toAdd = [],
                i = 0;
            for (var id in vm.routes) {
                for (var pos in vm.routes[id].tracks) {
                    toAdd[i] = vm.routes[id].tracks[pos];
                    i++;
                }
            }
            MapService.createGeojsonLayer(toAdd);
        };

        var getTrack = function (url, packId, pos) {
            Communication.getJSON(url)
                .then(function (data) {
                    if (!vm.routes[packId].tracks) {
                        vm.routes[packId].tracks = {};
                    }
                    vm.routes[packId].tracks[pos] = data;
                    if (!vm.tracks) {
                        vm.tracks = {};
                        vm.tracks[packId] = {};
                    }
                    else if (!vm.tracks[packId]) {
                        vm.tracks[packId] = {};
                    }

                    vm.tracks[packId][pos] = data;

                    if (+pos === 0) {
                        if (data.features && data.features[0] && data.features[0].properties && data.features[0].properties.color) {
                            vm.routes[packId].color = data.features[0].properties.color;
                        }
                        else {
                            vm.routes[packId].color = '#000000';
                        }

                    }

                    // localStorage.$wm_taxonomy_tracks = JSON.stringify(vm.tracks);

                    updateMapView();
                },
                    function (error) {
                        console.error("DetailTaxonommy.getTrack() ", error);
                    });
        };

        var getTracksForPack = function (packId) {
            Communication.getJSON(communicationConf.downloadJSONUrl + packId + '/app.json')
                .then(function (data) {
                    for (var i in data.routes) {
                        getTrack(data.routes[i], packId, i);
                    }
                },
                    function (error) {
                        console.error("DetailTaxonommy.getTracksForPack() ", error);
                    });
        };

        registeredEvents.push(
            $rootScope.$on('taxonomy-' + taxonomyType + '-updated', function (e, value) {
                $ionicLoading.hide();
                vm.taxonomy = value;
                vm.item = value[id];
                vm.title = vm.item.name;
                forceDigest();
            })
        );

        registeredEvents.push(
            $rootScope.$on('taxonomy-activity-updated', function (e, value) {
                $ionicLoading.hide();
                vm.activities = value;
                for (var i in vm.activities) {
                    if (!vm.activities[i].icon) {
                        vm.activities[i].icon = 'wm-icon-help-circled';
                    }
                }
                forceDigest();
            })
        );

        registeredEvents.push(
            $rootScope.$on('packages-updated', function (e, value) {
                $ionicLoading.hide();
                vm.routes = {};
                for (var i in value) {
                    if (value[i][taxonomyType]) {
                        for (var j in value[i][taxonomyType]) {
                            if (value[i][taxonomyType][j] === id) {
                                vm.routes[i] = value[i];
                                vm.routes[i].tracks = vm.tracks[i];
                                getTracksForPack(i);
                                break;
                            }
                        }
                    }
                }

                forceDigest();
            })
        );

        registeredEvents.push(
            $rootScope.$on('userDownloadedPackages-updated', function (e, value) {
                vm.userDownloadedPackages = value;
                Utils.forceDigest();
            })
        );

        registeredEvents.push(
            $rootScope.$on('$ionicView.beforeLeave', function () {
                MapService.resetLayers();
                for (var i in registeredEvents) {
                    registeredEvents[i]();
                }
            })
        );

        $ionicLoading.show();
        MapService.resetView();
        $rootScope.$emit('geolocate');
        PackageService.getRoutes();
        PackageService.getDownloadedPackages();
        PackageService.getTaxonomy('activity');
        PackageService.getTaxonomy(taxonomyType);
        MapService.resetLayers();

        return vm;
    });