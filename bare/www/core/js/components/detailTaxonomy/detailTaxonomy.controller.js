angular.module('webmapp')

    .controller('DetailTaxonomyController', function DetailTaxonomyController(
        Communication,
        CONFIG,
        $ionicLoading,
        $rootScope,
        $state,
        $translate,
        MapService,
        PackageService,
        Utils
    ) {
        var vm = {};

        vm.title = CONFIG.OPTIONS.title;
        var communicationConf = CONFIG.COMMUNICATION;

        vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";
        vm.taxonomy = {};
        vm.item = {};
        vm.routes = {};
        vm.tracks = localStorage.$wm_taxonomy_tracks ? JSON.parse(localStorage.$wm_taxonomy_tracks) : {};
        vm.activities = {};
        vm.userDownloadedPackages = {};

        vm.fullDescription = false;

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
                PackageService.openPackage(packId);
            } else {
                PackageService.downloadPack(packId);
            }
        };

        var updateMapView = function() {
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

                        localStorage.$wm_taxonomy_tracks = JSON.stringify(vm.tracks);

                        updateMapView();
                    },
                    function (error) {
                        console.log("PackageService.getTrack() ", error);
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
                        console.log("PackageService.getTracksForPack() ", error);
                    });
        };

        $rootScope.$on('taxonomy-' + taxonomyType + '-updated', function (e, value) {
            $ionicLoading.hide();
            vm.taxonomy = value;
            vm.item = value[id];
            vm.title = vm.item.name;
            forceDigest();
        });

        $rootScope.$on('taxonomy-activity-updated', function (e, value) {
            $ionicLoading.hide();
            vm.activities = value;
            for (var i in vm.activities) {
                if (!vm.activities[i].icon) {
                    vm.activities[i].icon = 'wm-icon-help-circled';
                }
            }
            forceDigest();
        });

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
        });

        $rootScope.$on('userDownloadedPackages-updated', function (e, value) {
            vm.userDownloadedPackages = value;
            Utils.forceDigest();
        });

        $ionicLoading.show();
        PackageService.getRoutes();
        PackageService.getDownloadedPackages();
        PackageService.getTaxonomy('activity');
        PackageService.getTaxonomy(taxonomyType);
        MapService.resetView();

        return vm;
    });