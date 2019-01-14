/*global angular*/

angular.module('webmapp')

    .factory('MBTiles', function MBTiles(
        $q
    ) {
        var mbtiles = {},
            isAndroid = window.cordova && window.cordova.platformId === 'android';

        var openCordovaDB = function (dbPath) {
            var basename, pathParts, additionalMapPath;
            if (isAndroid) {
                basename = dbPath;
            } else {
                pathParts = dbPath.split('/');
                additionalMapPath = !!localStorage.$wm_mhildId ? 'map_' + localStorage.$wm_mhildId + '/' : 'map/';
                // TODO: instead of .pop(), check the base path and preserve subfolder
                basename = 'NoCloud/' + additionalMapPath + pathParts.pop();
            }
            return sqlitePlugin.openDatabase({
                name: basename,
                iosDatabaseLocation: 'Library'
            });
        };

        mbtiles.join = function (baseMbtiles, importMbtiles, progressFunction) {
            var defer = $q.defer();

            var db = {};

            var attachStmt = "ATTACH DATABASE ? AS importDb;",
                detachStmt = "DETACH DATABASE importDb;",
                mapCountStmt = "SELECT COUNT(*) AS count FROM map;",
                mapInsertStmt = "INSERT OR IGNORE INTO map (tile_id, zoom_level, tile_column, tile_row) SELECT tile_id, zoom_level, tile_column, tile_row FROM importDb.map;",
                imagesCountStmt = "SELECT COUNT(*) AS count FROM images;",
                imagesInsertStmt = "INSERT OR IGNORE INTO images (tile_id, tile_data) SELECT tile_id, tile_data FROM importDb.images;",
                metaStmt = "SELECT value FROM metadata WHERE name = ?;",
                metaUpdateStmt = "UPDATE metadata SET value = ? WHERE name = ?;";

            var progress = {
                loaded: 0,
                total: 0,
                ref: importMbtiles
            };

            var mergeMeta = function () {
                var updateValue = function (key, value) {
                    db[baseMbtiles].executeSql(metaUpdateStmt, [value, key], function () {
                    }, function (err) {
                        console.error(err);
                    });
                };

                db[baseMbtiles].executeSql(metaStmt, ['minzoom'], function (baseRes) {
                    db[importMbtiles].executeSql(metaStmt, ['minzoom'], function (importRes) {
                        if (importRes.rows.length > 0) {
                            var importValue = importRes.rows.item(0).value;

                            if (baseRes.rows.length > 0) {
                                var baseValue = baseRes.rows.item(0).value;
                                if (+baseValue > +importValue) {
                                    updateValue('minzoom', importValue);
                                }
                            }
                            else {
                                updateValue('minzoom', importValue);
                            }
                        }
                    }, function (err) {
                        console.error(err);
                    });
                }, function (err) {
                    console.error(err);
                });

                db[baseMbtiles].executeSql(metaStmt, ['maxzoom'], function (baseRes) {
                    db[importMbtiles].executeSql(metaStmt, ['maxzoom'], function (importRes) {
                        if (importRes.rows.length > 0) {
                            var importValue = importRes.rows.item(0).value;

                            if (baseRes.rows.length > 0) {
                                var baseValue = baseRes.rows.item(0).value;
                                if (+baseValue < +importValue) {
                                    updateValue('maxzoom', importValue);
                                }
                            }
                            else {
                                updateValue('maxzoom', importValue);
                            }
                        }
                    }, function (err) {
                        console.error(err);
                    });
                }, function (err) {
                    console.error(err);
                });

                db[baseMbtiles].executeSql(metaStmt, ['bounds'], function (baseRes) {
                    db[importMbtiles].executeSql(metaStmt, ['bounds'], function (importRes) {
                        if (importRes.rows.length > 0) {
                            var importValue = importRes.rows.item(0).value;
                            if (baseRes.rows.length > 0) {
                                var baseValue = baseRes.rows.item(0).value;
                                baseValue = baseValue.split(',');
                                importValue = importValue.split(',');
                                var changed = false;

                                if (baseValue[0] > importValue[0]) {
                                    baseValue[0] = importValue[0];
                                    changed = true;
                                }
                                if (baseValue[1] > importValue[1]) {
                                    baseValue[1] = importValue[1];
                                    changed = true;
                                }
                                if (baseValue[2] < importValue[2]) {
                                    baseValue[2] = importValue[2];
                                    changed = true;
                                }
                                if (baseValue[3] < importValue[3]) {
                                    baseValue[3] = importValue[3];
                                    changed = true;
                                }

                                if (changed) {
                                    baseValue = baseValue.join(',');
                                    updateValue('bounds', baseValue);
                                }
                            }
                            else {
                                updateValue('bounds', importValue);
                            }
                        }
                    }, function (err) {
                        console.error(err);
                    });
                }, function (err) {
                    console.error(err);
                });
            };

            var transferDb = function () {
                var transferDefer = $q.defer();

                mergeMeta();

                db[baseMbtiles].executeSql(attachStmt, [importMbtiles], function () {
                    db[baseMbtiles].executeSql(imagesInsertStmt, [], function (imagesRes) {
                        progress.loaded = imagesRes.rowsAffected;
                        progressFunction(progress);
                        db[baseMbtiles].executeSql(mapInsertStmt, [], function () {
                            db[baseMbtiles].executeSql(detachStmt, [], function () {
                                progress.loaded = progress.total;
                                progressFunction(progress);
                                transferDefer.resolve();
                            }, function (err) {
                                transferDefer.reject(err);
                            });
                        }, function (err) {
                            transferDefer.reject(err);
                        });
                    }, function (err) {
                        transferDefer.reject(err);
                    });
                }, function (err) {
                    transferDefer.reject(err);
                });

                return transferDefer.promise;
            };

            baseMbtiles = baseMbtiles.substr(7);
            importMbtiles = importMbtiles.substr(7);

            db[baseMbtiles] = openCordovaDB(baseMbtiles);
            db[importMbtiles] = openCordovaDB(importMbtiles);

            db[importMbtiles].executeSql(mapCountStmt, [], function (mapCount) {
                progress.total += mapCount.rows.item(0).count;
                db[importMbtiles].executeSql(imagesCountStmt, [], function (imagesCount) {
                    progress.total += imagesCount.rows.item(0).count;
                    transferDb().then(function () {
                        defer.resolve();
                    }, function (err) {
                        defer.reject(err);
                    });
                }, function (err) {
                    defer.reject(err);
                });
            }, function (err) {
                defer.reject(err);
            });

            return defer.promise;
        };

        mbtiles.getTotalRecords = function (arrayLink) {
            /* it counts the sum of all mbtiles map and images table records
             */
            var defer = $q.defer(),
                mapStmt = "SELECT COUNT(*) AS count FROM map;",
                imagesStmt = "SELECT COUNT(*) AS count FROM images;",
                total = 0,
                promises = [],
                db = [];

            var calculateDbTotal = function (link) {
                var calcDefer = $q.defer();
                var currentDb = openCordovaDB(link);
                db[link] = currentDb;
                currentDb.executeSql(imagesStmt, [], function (images) {
                    total += images.rows.item(0).count;
                    currentDb.executeSql(mapStmt, [], function (map) {
                        total += map.rows.item(0).count;
                        calcDefer.resolve();
                    }, function (err) {
                        console.error(err);
                        calcDefer.resolve();
                    });
                }, function (err) {
                    console.error(err);
                    defer.resolve();
                });

                return calcDefer.promise;
            };

            var start = 0;
            if (!isAndroid) {
                start = 1;
            }

            for (var i = start; i < arrayLink.length; i++) {
                promises.push(calculateDbTotal(arrayLink[i].substring(7)));
            }

            $q.all(promises).then(function () {
                defer.resolve(total);
            }).catch(function (err) {
                console.error(err);
                defer.reject(err);
            });

            return defer.promise;
        };

        return mbtiles;
    });
