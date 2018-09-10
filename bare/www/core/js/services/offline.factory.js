angular.module('webmapp')

    .factory('Offline', function Offline(
        $cordovaFile,
        $cordovaFileTransfer,
        $ionicLoading,
        $cordovaZip,
        $q,
        Utils,
        CONFIG,
        $ionicPopup,
        $translate
    ) {
        var offline = {};

        var _defaultLayer = '',
            _onlineUrl = '',
            _tmsBase = false,
            _state = {
                active: JSON.parse(localStorage.getItem('offlineMode')) || false,
                available: JSON.parse(localStorage.getItem('offlineAvailable')) || false
            };

        var _offlineUrl = localStorage.getItem('offlineUrl') || '';

        var resetMapView = function () { };

        if (!Date.now) {
            Date.now = function () {
                return new Date().getTime();
            };
        }

        offline.state = _state;
        offline.options = CONFIG.OFFLINE || {};

        offline.reset = function () {
            if (_state.active) {
                offline.toggleMode();
            }

            localStorage.setItem('offlineUrl', '');
            localStorage.setItem('offlineMode', false);
            localStorage.setItem('offlineAvailable', false);
            localStorage.setItem('offlineTms', offline.options.tms);

            $cordovaFile.removeRecursively(cordova.file.dataDirectory, 'map');
        };

        offline.getOfflineTms = function () {
            return offline.options.tms;
        };

        offline.getOfflineUrl = function () {
            _offlineUrl = _offlineUrl.replace(/^(.*)map\/([a-zA-Z0-9-_\/]*\.[a-zA-Z0-9-_]*)/g, cordova.file.dataDirectory + 'map/$2');
            localStorage.setItem('offlineUrl', _offlineUrl);
            return _offlineUrl;
        };

        offline.canBeEnabled = function () {
            return _offlineUrl !== '' && _state.available;
        };

        offline.isActive = function () {
            return _state.available && _state.active;
        };

        offline.toggleMode = function () {
            offline.resetCurrentMapAndGoBack();
            if (_state.active) {
                _defaultLayer.setUrl(_onlineUrl);
                _state.active = false;
                _defaultLayer.options.tms = _tmsBase;

            } else {
                if (typeof offline.options.tms !== 'undefined') {
                    //_defaultLayer.options.tms = offline.options.tms;
                }
                _defaultLayer.setUrl(_offlineUrl);
                _state.active = true;
            }
            localStorage.setItem('offlineMode', _state.active);
            resetMapView();
        };

        offline.setDefaultInfo = function (defaultLayer, onlineUrl, tms, resetView) {
            _defaultLayer = defaultLayer;
            _onlineUrl = onlineUrl;
            _tmsBase = tms;

            resetMapView = resetView;
        };

        offline.removeMap = function () {
            $cordovaFile
                .removeRecursively(cordova.file.dataDirectory + 'map')
                .then(function () {
                    console.log(cordova.file.dataDirectory + 'map - removed');
                }, function (error) {
                    console.error(error);
                });
        };

        offline.downloadMap = function (vm) {
            var arrayLink = [];

            if (typeof offline.options.urlMbtiles === "string") {
                arrayLink.push(offline.options.urlMbtiles);
            }
            else {
                for (var i in offline.options.urlMbtiles) {
                    arrayLink.push(offline.options.urlMbtiles[i]);
                }
            }

            if (typeof offline.options.urlImages === "string") {
                arrayLink.push(offline.options.urlImages);
            }
            else {
                for (var i in offline.options.urlImages) {
                    arrayLink.push(offline.options.urlImages[i]);
                }
            }

            var vmReset = function () {
                vm.downloadProgress = 0;
                vm.unzipProgress = 0;
                vm.downloadInProgress = false;
                vm.unzipInProgress = false;
                vm.canBeEnabled = false;
            };

            vmReset();

            var abortAll = function () {
                for (var i = 0; i < transferPromises.length; i++) {
                    if (typeof transferPromises[i].abort === 'function') {
                        console.log('abort')
                        transferPromises[i].abort();
                    }
                }

                if (!aborted) {
                    console.log('rimuovo mappa')
                    offline.removeMap();
                    aborted = true;
                }

                vmReset();
            };

            var destDirectory = cordova.file.dataDirectory + 'map/',
                transferPromises = [],
                promises = [],
                aborted = false;

            arrayLink.forEach(function (item) {
                var filename = item.split('/').pop(),
                    format = filename.split('.').pop(),
                    targetPath = destDirectory + filename,
                    currentDefer = $q.defer(),
                    currentTransfert;

                promises.push(currentDefer.promise);

                currentTransfert = $cordovaFileTransfer.download(encodeURI(item), encodeURI(targetPath), {}, true);
                transferPromises.push(currentTransfert);

                currentTransfert
                    .then(function (result) {
                        if (aborted) {
                            return;
                        }
                        vm.unzipInProgress = true;
                        if (format === 'zip') {
                            vm.unzipInProgress = true;
                            currentDefer.resolve();
                            $cordovaZip.unzip(targetPath, destDirectory)
                                .then(function () {
                                    // console.log('finito l\'unzip');
                                    vm.unzipInProgress = false;
                                    $cordovaFile.removeFile(destDirectory, filename);
                                    currentDefer.resolve();
                                }, function () {
                                    currentDefer.reject('Si è verificato un errore nell\'installazione, riprova ');
                                    // console.error('Si è verificato un errore nell\'unzip delle immagini');
                                },
                                    function (progress) {
                                        //console.log(progress);
                                        vm.unzipInProgress = true;
                                    });
                        } else if (format === 'mbtiles') {
                            currentDefer.resolve();
                            _offlineUrl = destDirectory + filename;
                            // console.log(_offlineUrl);
                            localStorage.setItem('offlineUrl', _offlineUrl);
                        }
                        // console.log(result);
                        // console.log('scaricato ' + format);
                    },
                        function (error) {
                            currentDefer.reject('Si è verificato un errore nel download, riprova ');
                            // console.error('Si è verificato un errore nel download, riprova ', JSON.stringify(error));
                            $ionicPopup.alert({
                                title: $translate.instant("Attenzione"),
                                template: $translate.instant("C'è stato un problema nello scaricamento, riprova più tardi."),
                                buttons: [{
                                    text: 'Ok',
                                    type: 'button-positive'
                                }]
                            });
                            abortAll();
                        },
                        function (progress) {
                            if (aborted) {
                                return;
                            }
                            //console.log(progress);
                            if (format === 'mbtiles') {
                                vm.downloadProgress = Math.min(Math.max(Math.round((progress.loaded / progress.total) * 100), vm.downloadProgress), 99);
                            }
                            vm.downloadInProgress = true;
                        });
            });

            $q.all(promises).then(function () {
                vm.downloadInProgress = false;
                vm.canBeEnabled = true;
                vm.unzipInProgress = false;
                _state.available = true;
                localStorage.setItem('offlineAvailable', _state.available);
            });

            return $q.all(promises);

        };

        offline.getOfflineBasePath = function () {
            return cordova.file.dataDirectory;
        };

        offline.getOfflineMhildBasePathById = function (id) {
            return offline.getOfflineBasePath() + 'map_' + id + '/';
        };

        offline.getRealImageUrl = function (url) {
            var offlineUrl = url;
            if (!!localStorage.$wm_mhildConf) {
                var index = url.indexOf('uploads');
                if (index !== -1) {
                    var substr = url.substring(index + 8, url.length);

                    offlineUrl = substr.replace(/\//g, '_');
                    offlineUrl = offline.getOfflineMhildBasePathById(localStorage.$wm_mhildId) + 'images/' + offlineUrl;
                }

            } else if (localStorage.offlineMode) {
                var index = url.indexOf('uploads');
                if (index !== -1) {
                    var substr = url.substring(index + 8, url.length);

                    offlineUrl = substr.replace(/\//g, '_');
                    offlineUrl = cordova.file.dataDirectory + 'map/images/' + offlineUrl;
                }

            } else {
                offlineUrl = url;
            }

            return offlineUrl;
        };

        offline.removePackById = function (id) {
            $cordovaFile
                .removeRecursively(cordova.file.dataDirectory, 'map_' + id)
                .then(function () {
                    console.log('done remove ' + id);
                }, function (error) {
                    console.error(error);
                });
        };

        offline.downloadUserMap = function (id, arrayLink, vm) {
            var vmReset = function () {
                vm.downloadInProgress = false;
                vm.downloadProgress = 0;
                //vm.unzipInProgress = false;
            };

            var abortAll = function () {
                for (var i = 0; i < transferPromises.length; i++) {
                    if (typeof transferPromises[i].abort === 'function') {
                        console.log('abort')
                        transferPromises[i].abort();
                    }
                }

                if (!aborted) {
                    offline.removePackById(id);
                    aborted = true;
                }

                vmReset();
            };

            vmReset();

            $.ajaxSetup({
                cache: false
            });

            var destDirectory = offline.getOfflineMhildBasePathById(id),
                transferPromises = [],
                promises = [],
                aborted = false;

            arrayLink.forEach(function (item) {
                var split = item.split("/"),
                    filename = split.pop(),
                    format = filename.split('.').pop(),
                    targetPath = destDirectory,
                    currentDefer = $q.defer(),
                    currentTransfert;

                if (split[split.length - 2] === "languages") {
                    filename = split[split.length - 2] + "/" + split[split.length - 1] + "/" + filename;
                }

                targetPath = destDirectory + filename;

                currentDefer = $q.defer();

                promises.push(currentDefer.promise);

                // + '?ts=' + Date.now() is added to prevent cached data making the download url different
                currentTransfert = $cordovaFileTransfer.download(encodeURI(item + '?ts=' + Date.now()), encodeURI(targetPath), {}, true);
                transferPromises.push(currentTransfert);

                currentTransfert
                    .then(function () {
                        if (aborted) {
                            return;
                        }

                        vm.unzipInProgress = true;
                        if (format === 'zip') {
                            $cordovaZip.unzip(targetPath, destDirectory)
                                .then(function () {
                                    vm.unzipInProgress = false;
                                    $cordovaFile.removeFile(destDirectory, filename);
                                    currentDefer.resolve();
                                }, function (error) {
                                    currentDefer.reject('Si è verificato un errore nell\'installazione, riprova ');
                                    abortAll();
                                    console.error('Si è verificato un errore nell\'installazione, riprova ', JSON.stringify(error));
                                },
                                    function (progress) {
                                        vm.unzipInProgress = true;
                                    });
                        } else {
                            currentDefer.resolve();

                            // TODO: test a better flow
                            // if (format !== 'mbtiles') {
                            //     vm.downloadProgress++;
                            // }
                        }
                    },
                        function (error) {
                            currentDefer.reject('Si è verificato un errore nel download, riprova ');
                            abortAll();
                            console.error('Si è verificato un errore nel download, riprova ', JSON.stringify(error));
                        },
                        function (progress) {
                            if (aborted) {
                                return;
                            }

                            if (format === 'mbtiles') {
                                vm.downloadProgress = Math.min(Math.max(Math.round((progress.loaded / progress.total) * 100), vm.downloadProgress), 99);
                            }
                            vm.downloadInProgress = true;
                        });
            });

            $.ajaxSetup();

            return $q.all(promises);
        };

        offline.resetCurrentMapAndGoBack = function () {
            delete localStorage.$wm_mhildConf;
            delete localStorage.$wm_mhildBaseUrl;
            delete localStorage.$wm_mhildId;

            delete localStorage.lastSent;
            delete localStorage.currentMapLayer;
            delete localStorage.activeFilters;

            delete sessionStorage.$wm_doBack;
            location.href = 'index.html';

            $ionicLoading.show({
                template: '<ion-spinner></ion-spinner>'
            });

            Utils.forceDigest();
        };

        return offline;
    });