/*global angular*/

angular.module('webmapp')

    .factory('MBTiles', function MBTiles(
        $q
    ) {
        var mbtiles = {},
            isAndroid = cordova.platformId === 'android';

        var openCordovaDB = function (dbPath) {
            var openDefer = $q.defer();
            var basename, pathParts, additionalMapPath;
            if (isAndroid) {
                basename = dbPath;
            } else {
                pathParts = dbPath.split('/');
                additionalMapPath = !!localStorage.$wm_mhildId ? 'map_' + localStorage.$wm_mhildId + '/' : 'map/';
                // TODO: instead of .pop(), check the base path and preserve subfolder
                basename = 'NoCloud/' + additionalMapPath + pathParts.pop();
            }
            sqlitePlugin.openDatabase({
                name: basename,
                iosDatabaseLocation: 'Library'
            }, function (e) {
                openDefer.resolve(e);
            }, function (e) {
                openDefer.reject(e)
                console.error(e);
            });

            return openDefer.promise;
        };

        mbtiles.transformImages = function (url, progressFunction) {
            var defer = $q.defer(),
                db,
                progress = {
                    loaded: 0,
                    total: 0,
                    ref: url
                };

            var imagesCountStmt = "SELECT COUNT(*) AS count FROM images;",
                selectStmt = "SELECT tile_id, BASE64(tile_data) AS base64_tile_data FROM images;",
                updateStmt = "UPDATE images SET tile_data = ? WHERE tile_id = ?;";

            var updateImage = function (item) {
                var updateDefer = $q.defer();
                db.executeSql(updateStmt, [item['base64_tile_data'], item['tile_id']], function () {
                    progress.loaded++;
                    progressFunction(progress);
                    updateDefer.resolve();
                }, function (err) {
                    console.error(err);
                    updateDefer.reject();
                });
                return updateDefer.promise;
            };

            if (isAndroid) {
                openCordovaDB(url.substr(7)).then(function (res) {
                    db = res;
                    db.executeSql(imagesCountStmt, [], function (count) {
                        progress.total = count.rows.item(0).count;
                        db.executeSql(selectStmt, [], function (selection) {
                            var promises = [];

                            for (var i = 0; i < selection.rows.length; i++) {
                                promises.push(updateImage(selection.rows.item(i)));
                            }

                            $q.all(promises).then(function () {
                                db.close();
                                defer.resolve();
                            }).catch(function (err) {
                                console.error(err);
                                defer.reject(err);
                            });
                        }, function (err) {
                            console.error(err);
                            defer.reject();
                        });
                    }, function (err) {
                        console.error(err);
                        defer.reject();
                    });
                }).catch(function (err) {
                    defer.reject(err);
                });
            }
            else {
                defer.resolve();
            }

            return defer.promise;
        };

        mbtiles.join = function (baseMbtiles, importMbtiles, progressFunction) {
            var defer = $q.defer();

            var db = {};

            var mapCountStmt = "SELECT COUNT(*) AS count FROM map;",
                imagesCountStmt = "SELECT COUNT(*) AS count FROM images;",
                metaStmt = "SELECT value FROM metadata WHERE name = ?;",
                metaUpdateStmt = "UPDATE metadata SET value = ? WHERE name = ?;",
                mapSelectStmt = "SELECT * FROM map;",
                mapInsertStmt = "INSERT OR IGNORE INTO map (tile_id, tile_row, tile_column, zoom_level) VALUES",
                mapInsertValuesStmt = " (?, ?, ?, ?)",
                imagesSelectStmt = isAndroid ? "SELECT tile_id, BASE64(tile_data) AS base64_tile_data FROM images;" : "SELECT * FROM images;",
                imagesInsertStmt = "INSERT OR IGNORE INTO images (tile_id, tile_data) VALUES",
                imagesInsertValuesStmt = " (?, ?)";

            var progress = {
                loaded: 0,
                total: 0,
                ref: importMbtiles
            };

            var mergeMeta = function () {
                var updateValue = function (key, value) {
                    db[baseMbtiles].executeSql(metaUpdateStmt, [value, key], function (res) {
                        console.log("updated " + key);
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

            var mergeTable = function (selectStmt, insertStmt, insertValuesStmt, columns) {
                var mergeDefer = $q.defer(),
                    promises = [];

                var tableInsert = function (arrayValues) {
                    var insertDefer = $q.defer();
                    var stmt = insertStmt;
                    var itemLen = arrayValues.length / columns.length;
                    for (var j = 0; j < itemLen; j++) {
                        if (j !== 0) {
                            stmt += ',';
                        }
                        stmt += insertValuesStmt;
                    }
                    stmt += ";";
                    db[baseMbtiles].executeSql(stmt, arrayValues, function () {
                        console.log("Added")
                        progress.loaded += itemLen;
                        progressFunction(progress);
                        insertDefer.resolve();
                    }, function (err) {
                        console.error(err);
                        insertDefer.reject();
                    });

                    return insertDefer.promise;
                }

                db[importMbtiles].executeSql(selectStmt, [], function (table) {
                    if (table.rows.length > 0) {
                        var values = [],
                            i = 0;

                        for (i = 0; i < table.rows.length; i++) {
                            var item = table.rows.item(i);

                            for (var id in columns) {
                                values.push(item[columns[id]]);
                            }

                            if (i % 100 === 99 || i === table.rows.length - 1) {
                                console.log("INSERT")
                                promises.push(tableInsert(values));
                                values = [];
                            }
                        }

                        $q.all(promises).then(function () {
                            mergeDefer.resolve();
                        }).catch(function (err) {
                            console.error(err);
                            mergeDefer.reject(err);
                        });
                    }
                    else {
                        mergeDefer.resolve();
                    }
                }, function (err) {
                    console.error(err);
                    mergeDefer.reject(err);
                });

                return mergeDefer.promise;
            };

            var transferDb = function () {
                mergeMeta();

                mergeTable(mapSelectStmt, mapInsertStmt, mapInsertValuesStmt, ['tile_id', 'tile_row', 'tile_column', 'zoom_level']).then(function () {
                    var imageColumn = 'tile_data';
                    if (isAndroid) {
                        imageColumn = 'base64_tile_data';
                    }
                    mergeTable(imagesSelectStmt, imagesInsertStmt, imagesInsertValuesStmt, ['tile_id', imageColumn]).then(function () {
                        setTimeout(function () {
                            db[baseMbtiles].close();
                            db[importMbtiles].close();
                            defer.resolve();
                        }, 1000);
                    }).catch(function (err) {
                        console.error(err);
                        defer.reject(err);
                    });
                }).catch(function (err) {
                    console.error(err);
                    defer.reject(err);
                });
            };

            baseMbtiles = baseMbtiles.substr(7);
            importMbtiles = importMbtiles.substr(7);

            openCordovaDB(baseMbtiles).then(function (baseDb) {
                db[baseMbtiles] = baseDb;
                openCordovaDB(importMbtiles).then(function (importDb) {
                    db[importMbtiles] = importDb;
                    db[importMbtiles].executeSql(mapCountStmt, [], function (mapCount) {
                        progress.total += mapCount.rows.item(0).count;
                        db[importMbtiles].executeSql(imagesCountStmt, [], function (imagesCount) {
                            progress.total += mapCount.rows.item(0).count;
                            transferDb();
                        }, function (err) {
                            console.error(err);
                            defer.reject(err);
                        });
                    }, function (err) {
                        console.error(err);
                        defer.reject(err);
                    });
                }).catch(function (err) {
                    console.error(err);
                    defer.reject(err);
                });
            }).catch(function (err) {
                console.error(err);
                defer.reject(err);
            });

            return defer.promise;
        };

        mbtiles.getTotalRecords = function (arrayLink) {
            /* it counts the sum of all mbtiles map and images table except for the first one
             * for android it counts the images of the first one, for ios skip the first one
             */
            var defer = $q.defer(),
                mapStmt = "SELECT COUNT(*) AS count FROM map;",
                imagesStmt = "SELECT COUNT(*) AS count FROM images;",
                total = 0,
                promises = [],
                db = [];

            var calculateDbTotal = function (link) {
                var calcDefer = $q.defer();
                openCordovaDB(link).then(function (currentDb) {
                    db.push(currentDb);
                    currentDb.executeSql(imagesStmt, [], function (res) {
                        total += res.rows.item(0).count;
                        if (link !== arrayLink[0].substring(7)) {
                            currentDb.executeSql(mapStmt, [], function (res) {
                                total += res.rows.item(0).count;
                                calcDefer.resolve();
                            }, function (err) {
                                console.error(err);
                                defer.resolve();
                            });
                        }
                        else {
                            calcDefer.resolve();
                        }
                    }, function (err) {
                        console.error(err);
                        defer.resolve();
                    });
                }).catch(function (err) {
                    console.error(err);
                    defer.resolve();
                });

                return calcDefer.promise;
            };

            var start = 0;
            if (!isAndroid) {
                start = 1
            }

            for (var i = start; i < arrayLink.length; i++) {
                promises.push(calculateDbTotal(arrayLink[i].substring(7)));
            }

            $q.all(promises).then(function () {
                for (var i = 0; i < db.length; i++) {
                    db[i].close();
                }
                defer.resolve(total);
            }).catch(function (err) {
                console.error(err);
                defer.reject(err);
            })

            return defer.promise;
        };

        return mbtiles;
    });
