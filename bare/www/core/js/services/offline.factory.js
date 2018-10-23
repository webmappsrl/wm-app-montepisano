angular.module('webmapp')

    .factory('Offline', function Offline(
        $cordovaFile,
        $cordovaFileTransfer,
        $cordovaZip,
        $ionicLoading,
        $ionicPopup,
        $q,
        $translate,
        CONFIG,
        MBTiles,
        Utils
    ) {
        var offline = {};

        var _defaultLayer = '',
            _onlineUrl = '',
            _tmsBase = false,
            _state = {
                active: JSON.parse(localStorage.getItem('offlineMode')) || false,
                available: JSON.parse(localStorage.getItem('offlineAvailable')) || false
            },
            _offlineUrl = localStorage.getItem('offlineUrl') || '';

        var transferPromises = [];

        try {
            _state.blocks = JSON.parse(localStorage.getItem('blocksCompleted')) || {};
        }
        catch (e) {
            _state.blocks = {};
        }

        var resetMapView = function () { };

        var updateOfflineState = function (item, value) {
            if (value) {
                _state.blocks[item] = value;
            }
            else {
                _state.blocks[item] = false;
                delete _state.blocks[item];
            }
            localStorage.setItem('blocksCompleted', JSON.stringify(_state.blocks));
        };

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

            localStorage.setItem('blocksCompleted', JSON.stringify({}));
            _state.blocks = {};
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
            if (_state.active) {
                _defaultLayer.setUrl(_onlineUrl);
                _state.active = false;
                _defaultLayer.options.tms = _tmsBase;
            } else {
                if (typeof offline.options.tms !== 'undefined') {
                    //_defaultLayer.options.tms = offline.options.tms;
                }
                _defaultLayer.setUrl(offline.getOfflineUrl());
                _state.active = true;
            }
            localStorage.setItem('offlineMode', _state.active);
            offline.resetCurrentMapAndGoBack();
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
            var arrayLink = [],
                mbtilesLink = [],
                aborted = false;

            if (typeof offline.options.urlMbtiles === "string") {
                if (offline.options.blocks) {
                    var suffix = function (number) {
                        var suf = number.toString();
                        while (suf.length < 4) {
                            suf = "0" + suf;
                        }
                        return suf;
                    };
                    for (var i = 0; i < offline.options.blocks; i++) {
                        arrayLink.push(offline.options.urlMbtiles + "_" + suffix(i));
                        mbtilesLink.push(offline.options.urlMbtiles + "_" + suffix(i));
                    }
                }
                else {
                    arrayLink.push(offline.options.urlMbtiles);
                }
            }

            if (typeof offline.options.urlImages === "string") {
                arrayLink.push(offline.options.urlImages);
            }

            for (var layer in CONFIG.OVERLAY_LAYERS) {
                if (CONFIG.OVERLAY_LAYERS[layer].type === "tile_utfgrid_geojson") {
                    arrayLink.push(CONFIG.OFFLINE.baseUrl + "tiles/" + CONFIG.OVERLAY_LAYERS[layer].label.replace(/ /, "_") + ".mbtiles");
                }
            }

            var vmReset = function () {
                vm.downloadProgress = 0;
                vm.unzipProgress = 0;
                vm.downloadInProgress = false;
                vm.unzipInProgress = false;
                vm.canBeEnabled = false;
                aborted = false;
            };

            vmReset();

            var destDirectory = cordova.file.dataDirectory + 'map/',
                promises = [],
                aborted = false,
                map = {
                    downloadArray: {},
                    zipArray: {},
                    totalDownloadSize: (CONFIG.OFFLINE && CONFIG.OFFLINE.size) ? CONFIG.OFFLINE.size * 1024 * 1024 : -1,
                    mbtiles: {}
                };

            transferPromises = [];

            vm.abortMapDownload = function () {
                for (var i = 0; i < transferPromises.length; i++) {
                    if (typeof transferPromises[i].abort === 'function') {
                        transferPromises[i].abort();
                    }
                }

                vmReset();
                clearInterval(progressInterval);
                aborted = true;
                map = {
                    downloadArray: {},
                    zipArray: {},
                    totalDownloadSize: (CONFIG.OFFLINE && CONFIG.OFFLINE.size) ? CONFIG.OFFLINE.size * 1024 * 1024 : -1,
                    mbtiles: {}
                };
            };

            var calculateProgress = function () {
                if (vm.downloadInProgress) {
                    var progress = 0,
                        loaded = 0,
                        size = 0,
                        validSize = true;

                    for (var i in map.downloadArray) {
                        if (i !== "length") {
                            loaded += map.downloadArray[i].loaded;

                            if (map.downloadArray[i].size <= 0) {
                                validSize = false;
                            }

                            if (validSize) {
                                size += map.downloadArray[i].size;
                            }
                        }
                    }

                    if (validSize) {
                        progress = loaded / size;
                    }
                    else {
                        progress = loaded / map.totalDownloadSize;
                    }

                    if (map.zipArray.length && map.zipArray.length > 0) {
                        progress *= 80;

                        loaded = 0;
                        size = 0;

                        for (var i in map.zipArray) {
                            if (i !== "length") {
                                loaded += map.downloadArray[i].loaded;
                                size += map.downloadArray[i].size;
                            }
                        }

                        progress += loaded / size * 20;
                    }
                    else {
                        progress *= 100;
                    }

                    vm.downloadProgress = Math.min(Math.round(progress), 99);
                }
                else if (vm.installationInProgress) {
                    var progress = 0,
                        loaded = 0,
                        size = map.mbtiles.totalSize;

                    for (var i in map.mbtiles.progress) {
                        loaded += map.mbtiles.progress[i].loaded
                    }

                    progress = loaded / size * 100;

                    vm.installationProgress = Math.min(Math.round(progress), 99);
                }
            };

            var progressInterval = setInterval(calculateProgress, 100);

            arrayLink.forEach(function (item) {
                var filename = item.split('/').pop(),
                    format = filename.split('.').pop();

                if (!map.downloadArray.length) {
                    map.downloadArray.length = 1;
                }
                else {
                    map.downloadArray.length++;
                }
                map.downloadArray[filename] = {
                    loaded: 0,
                    size: 0
                };

                if (format === 'zip') {
                    if (!map.zipArray.length) {
                        map.zipArray.length = 1;
                    }
                    else {
                        map.zipArray.length++;
                    }
                    map.zipArray[filename] = {
                        loaded: 0,
                        size: 0
                    };
                }
            });

            /// $cordovaFile.moveFile(path, filename, newPath, newFilename);

            var transferFile = function (item, curDefer) {
                var filename = item.split('/').pop(),
                    format = filename.split('.').pop(),
                    targetPath = destDirectory + filename,
                    currentDefer = curDefer ? curDefer : $q.defer(),
                    currentTransfer;

                if (_state.blocks[item]) {
                    if (format === 'zip') {
                        map.zipArray[filename].size = _state.blocks[item];
                        map.zipArray[filename].loaded = _state.blocks[item];
                    }

                    map.downloadArray[filename].size = _state.blocks[item];
                    map.downloadArray[filename].loaded = _state.blocks[item];
                    currentDefer.resolve();
                }
                else {
                    currentTransfer = $cordovaFileTransfer.download(encodeURI(item), encodeURI(targetPath), {}, true);
                    transferPromises.push(currentTransfer);

                    currentTransfer.then(function (result) {
                        if (aborted) {
                            return;
                        }
                        if (format === 'zip') {
                            vm.unzipInProgress = true;
                            $cordovaZip.unzip(targetPath, destDirectory)
                                .then(function () {
                                    console.log('unzip ' + filename);
                                    $cordovaFile.removeFile(destDirectory, filename);
                                    updateOfflineState(item, map.zipArray[filename].size);
                                    currentDefer.resolve();
                                }, function () {
                                    updateOfflineState(item, false);
                                    currentDefer.reject('Si è verificato un errore nell\'installazione, riprova ');
                                    // console.error('Si è verificato un errore nell\'unzip delle immagini');
                                }, function (progress) {
                                    if (progress.lengthComputable) {
                                        map.zipArray[filename].size = progress.total;
                                    }
                                    map.zipArray[filename].loaded = progress.loaded;

                                    vm.unzipInProgress = true;
                                });
                        } else if (format.substring(0, 7) === 'mbtiles') {
                            if ((offline.options.blocks && format === "mbtiles_0000") ||
                                (!offline.options.blocks && filename === offline.options.urlMbtiles)) {
                                _offlineUrl = destDirectory + filename;
                                localStorage.setItem('offlineUrl', _offlineUrl);
                            }
                            updateOfflineState(item, map.downloadArray[filename].size);
                            currentDefer.resolve();
                        }
                        console.log('scaricato ' + filename);
                    }, function (err) {
                        console.warn("Error downloading " + item);
                        if (!aborted) {
                            setTimeout(function () {
                                if (!aborted) {
                                    transferFile(item, currentDefer);
                                }
                            }, 5000);
                        }
                    }, function (progress) {
                        if (aborted) {
                            return;
                        }

                        if (progress.lengthComputable) {
                            map.downloadArray[filename].size = progress.total;
                        }
                        map.downloadArray[filename].loaded = progress.loaded;

                        vm.downloadInProgress = true;
                    });
                }

                return currentDefer.promise;
            };

            arrayLink.forEach(function (item) {
                promises.push(transferFile(item));
            });

            $q.all(promises).then(function () {
                if (offline.options.blocks) {
                    for (var i = 0; i < mbtilesLink.length; i++) {
                        var filename = mbtilesLink[i].split('/').pop();
                        mbtilesLink[i] = destDirectory + filename;
                    }

                    MBTiles.getTotalRecords(mbtilesLink).then(function (total) {
                        map.mbtiles.totalSize = total;
                        map.mbtiles.progress = {};

                        mbtilesLink.forEach(function (item) {
                            map.mbtiles.progress[item] = {
                                size: 0,
                                loaded: 0
                            };
                        });

                        vm.downloadProgress = 100;
                        vm.installationInProgress = true;
                        vm.installationProgress = 0;
                        vm.downloadInProgress = false;

                        var progressFunction = function (progress) {
                            if (!map.mbtiles.progress[progress.ref]) {
                                map.mbtiles.progress[progress.ref] = {};
                            }
                            map.mbtiles.progress[progress.ref].loaded = progress.loaded;
                            map.mbtiles.progress[progress.ref].size = progress.total;
                        };

                        MBTiles.transformImages(mbtilesLink[0], progressFunction).then(function () {
                            var joinMBTilesArray = function (mbtilesArray) {
                                var defer = $q.defer();

                                if (mbtilesArray.length <= 1) {
                                    defer.resolve();
                                }
                                else {
                                    return MBTiles.join(mbtilesArray[0], mbtilesArray[1], progressFunction).then(function () {
                                        console.log('done ' + mbtilesArray[1]);
                                        var split = mbtilesArray[1].split('/'),
                                            filename = split.pop(),
                                            path = split.join('/');
                                        $cordovaFile.removeFile(path, filename).then(function () {
                                            console.log("removed " + filename);
                                        }, function (error) {
                                            console.error(error);
                                        });
                                        mbtilesArray.splice(1, 1);
                                        return joinMBTilesArray(mbtilesArray);
                                    }).catch(function (err) {
                                        console.error(err);
                                        defer.reject(err);
                                    });
                                }

                                return defer.promise;
                            };

                            joinMBTilesArray(mbtilesLink).then(function () {
                                vm.installationProgress = 100;
                                clearInterval(progressInterval);
                                setTimeout(function () {
                                    delete _state.blocks;
                                    localStorage.removeItem('blocksCompleted')
                                    vm.installationProgress = 0;
                                    vm.installationInProgress = false;
                                    vm.canBeEnabled = true;
                                    vm.unzipInProgress = false;
                                    _state.available = true;
                                    localStorage.setItem('offlineAvailable', _state.available);
                                    Utils.forceDigest();
                                }, 1000);
                            });
                        });
                    });
                }
                else {
                    vm.downloadInProgress = false;
                    vm.canBeEnabled = true;
                    vm.unzipInProgress = false;
                    clearInterval(progressInterval);
                    _state.available = true;
                    localStorage.setItem('offlineAvailable', _state.available);
                }
            }).catch(function (err) {
                $ionicPopup.alert({
                    title: $translate.instant("Attenzione"),
                    template: $translate.instant("C'è stato un problema nello scaricamento, riprova più tardi."),
                    buttons: [{
                        text: 'Ok',
                        type: 'button-positive'
                    }]
                });
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

                    offlineUrl = url.replace(/\//g, '_');
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
