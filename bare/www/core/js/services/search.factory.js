/*global angular, JsSearch, stemmer*/

angular.module('webmapp')

    .factory('Search', function Search(
        Utils,
        CONFIG
    ) {
        var search = {},
            layersEngine = {},
            searchConf = CONFIG.SEARCH,
            confLayers = CONFIG.OVERLAY_LAYERS;

        var confLayersList = confLayers.map(function (layer) {
            return layer.label;
        });

        var confLayersMap = confLayers.reduce(function (prev, curr) {
            prev[curr.label] = curr;
            return prev;
        }, {});

        var confLayersMapById = confLayers.reduce(function (prev, curr) {
            prev[curr.id] = curr;
            return prev;
        }, {});

        var activeLayersMap = confLayers.reduce(function (prev, curr) {
            if (!curr.skipSearch) {
                prev[curr.label] = {
                    state: false
                };
            }
            return prev;
        }, {});


        if (CONFIG.MAP.filters) {


            var layerFilterMap = {};
            var currentFilterMap = angular.copy(CONFIG.MAP.filters);
            for (var superCategoryId in currentFilterMap) {
                if (superCategoryId !== "base_maps" && currentFilterMap[superCategoryId].sublayers) {
                    var sublayers = currentFilterMap[superCategoryId].sublayers;
                    for (macroCategoryId in sublayers) {
                        if (sublayers[macroCategoryId].items && sublayers[macroCategoryId].items.length) {
                            var layers = sublayers[macroCategoryId].items;
                            for (var layerId in layers) {
                                var label = confLayersMapById[layers[layerId]] && confLayersMapById[layers[layerId]].label;
                                if (activeLayersMap[label]) {
                                    var info = {
                                        label: label,
                                        id: layers[layerId]
                                    };
                                    layers[layerId] = info;
                                    layerFilterMap[label] = info;
                                }
                                else {
                                    console.warn("Filter id " + layerId + " missing in OVERLAY_LAYERS");
                                }
                            }
                        } else {
                            delete sublayers[macroCategoryId];
                        }
                    }
                } else {
                    delete currentFilterMap[superCategoryId];
                }
            }


            for (var label in confLayersMap) {

                if (activeLayersMap[label] && !layerFilterMap[label]) {
                    var layer = confLayersMap[label];
                    var trackIndex = -1;
                    var poiIndex = -1;
                    if (layer.type === 'poi_geojson') {
                        var macroCategories = currentFilterMap["pois"].sublayers;
                        for (let i = 0; i < macroCategories.length; i++) {
                            var macroCat = macroCategories[i];
                            if (macroCat.label.it === 'altri') {
                                poiIndex = i;
                                break;
                            }
                        }
                        if (poiIndex == -1) {
                            poiIndex = macroCategories.length;
                            macroCategories[poiIndex] = {
                                label: {
                                    it: "altri",
                                    en: "others"
                                },
                                items: [],
                                isMacroCategoryGroup: true
                            };
                        }

                        if (poiIndex > -1 && macroCategories[poiIndex].isMacroCategoryGroup) {
                            var layers = macroCategories[poiIndex].items;
                            var info = {
                                label: label,
                                id: layers[layer.id]
                            };
                            layers.push(info);
                            layerFilterMap[label] = info;
                        }

                    } else if (layer.type === 'line_geojson') {
                        var macroCategories = currentFilterMap["tracks"].sublayers;
                        for (let i = 0; i < macroCategories.length; i++) {
                            var macroCat = macroCategories[i];
                            if (macroCat.label.it === 'altri') {
                                trackIndex = i;
                                break;
                            }
                        }
                        if (trackIndex == -1) {
                            trackIndex = macroCategories.length;
                            macroCategories[trackIndex] = {
                                label: {
                                    it: "altri",
                                    en: "others"
                                },
                                items: [],
                                isMacroCategoryGroup: true
                            };
                        }

                        if (trackIndex > -1 && macroCategories[trackIndex].isMacroCategoryGroup) {
                            var layers = macroCategories[trackIndex].items;
                            var info = {
                                label: label,
                                id: layers[layer.id]
                            };
                            layers.push(info);
                            layerFilterMap[label] = info;
                        }
                    }
                }


            }


            var featuresIdByLayerMap = {};
            search.setFeaturesIdByLayerMap = function (newMap) {

                if (typeof newMap === 'undefined') {
                    return;
                }
                featuresIdByLayerMap = newMap;
            }

            var setupEngine = function (layerName) {
                layersEngine[layerName] = new JsSearch.Search('id');

                if (searchConf.stemming) {
                    layersEngine[layerName].tokenizer = new JsSearch.StemmingTokenizer(stemmer, layersEngine[layerName].tokenizer);
                }
                if (searchConf.indexStrategy) {
                    layersEngine[layerName].indexStrategy = new JsSearch[searchConf.indexStrategy]();
                }
                if (searchConf.TFIDFRanking) {
                    layersEngine[layerName].searchIndex = new JsSearch.TfIdfSearchIndex('id');
                }

                for (var i in searchConf.indexFields) {
                    layersEngine[layerName].addIndex(['properties', searchConf.indexFields[i]]);
                }
            };

            var addToIndex = function (item, layerName) {
                var itemModel = {};

                itemModel = angular.extend({
                    id: item.properties.id || Utils.generateUID()
                }, item);
                layersEngine[layerName].addDocument(itemModel);
            };

            var getAllByLayer = function (layerName) {
                return layersEngine[layerName].documents_;
            };

            search.getActiveLayers = function () {
                var res = [];

                for (var i in activeLayersMap) {
                    if (activeLayersMap[i].state) {
                        res.push(i);
                    }
                }
                return res;
            };

            search.setActiveAllLayers = function () {
                // for (var i in activeLayersMap) {
                //     activeLayersMap[i].state = true;
                // }
            };

            search.getActiveLayersMap = function () {
                return activeLayersMap;
            };

            search.setActiveLayers = function (layersName) {
                if (typeof layersName === 'undefined') {
                    return;
                }

                for (var i in activeLayersMap) {
                    if (layersName.indexOf(i) !== -1) {
                        activeLayersMap[i].state = true;
                    } else {
                        activeLayersMap[i].state = false;
                    }
                }
            };

            search.clearEngine = function (layerName) {
                if (typeof confLayersMap[layerName] !== 'undefined' &&
                    typeof layersEngine[layerName] !== 'undefined') {
                    delete layersEngine[layerName];
                }
            }

            search.addToIndex = function (item, layerName) {
                if (typeof confLayersMap[layerName] !== 'undefined' &&
                    typeof layersEngine[layerName] === 'undefined') {
                    setupEngine(layerName);
                }

                if (typeof layersEngine[layerName] !== 'undefined') {
                    addToIndex(item, layerName);
                }
            };

            search.getByLayersWithDivider = function (query, layers) {

                if (!query && !layers) {
                    return [];
                }

                if (!query && !layers.length) {
                    return [];
                }

                var results = [],
                    currentResult = [];

                var filteredIds = getFilteredFeaturesIds();
                //filterById gonna change array length
                var filterBool = filteredIds.length ? true : false;
                if (query) {
                    if (layers.length) {
                        for (var c in confLayersMap) {
                            if (typeof layersEngine[c] !== 'undefined' &&
                                layers.indexOf(c) !== -1) {
                                currentResult = layersEngine[c].search(query);
                                if (filterBool) {
                                    currentResult = filterById(currentResult, filteredIds);
                                }
                                if (currentResult.length > 0) {
                                    results.push({
                                        label: c,
                                        divider: true
                                    });
                                    results = results.concat(currentResult);
                                }
                            }
                        }
                    } else {
                        for (var c in confLayersMap) {
                            if (typeof layersEngine[c] !== 'undefined') {
                                currentResult = layersEngine[c].search(query);
                                if (filterBool) {
                                    currentResult = filterById(currentResult, filteredIds);
                                }
                                if (currentResult.length > 0) {
                                    results.push({
                                        label: c,
                                        divider: true
                                    });
                                    results = results.concat(currentResult);
                                }
                            }
                        }
                    }
                } else if (searchConf.showAllByDefault || filteredIds.length) {
                    for (var l in confLayersMap) {
                        if (typeof layersEngine[l] !== 'undefined' &&
                            layers.indexOf(l) !== -1) {
                            currentResult = getAllByLayer(l);
                            if (filterBool) {
                                currentResult = filterById(currentResult, filteredIds);
                            }
                            if (currentResult.length > 0) {
                                results.push({
                                    label: l,
                                    divider: true
                                });
                                results = results.concat(currentResult);
                            }
                        }
                    }
                }


                return results;
            };

            search.getFeatures = function (query) {

                var results = [],
                    currentResult = [];

                var filteredIds = getFilteredFeaturesIds();
                var filterBool = filteredIds.length ? true : false;

                for (var c in confLayersMap) {
                    if (typeof layersEngine[c] !== 'undefined') {

                        if (query) {
                            currentResult = layersEngine[c].search(query);
                        } else {
                            currentResult = getAllByLayer(c);
                        }
                        if (filterBool) {
                            currentResult = filterById(currentResult, filteredIds);
                        }
                        if (currentResult.length > 0) {
                            results = results.concat(currentResult);
                        }
                    }
                }



                return results;
            };


            search.getAllWithDivider = function (query) {
                return search.getByLayersWithDivider(query, confLayersList);
            };

            search.getByLayersGroupedByLayer = function (query, layers) {
                var results = {},
                    currentResult = [];

                var filteredIds = getFilteredFeaturesIds();
                var filterBool = filteredIds.length ? true : false;
                if (query) {
                    if (layers.length) {
                        for (var c in confLayersMap) {
                            if (typeof layersEngine[c] !== 'undefined' &&
                                layers.indexOf(c) !== -1) {
                                currentResult = layersEngine[c].search(query);
                                if (filterBool) {
                                    currentResult = filterById(currentResult, filteredIds);
                                }
                                if (currentResult.length > 0) {
                                    results[c] = currentResult;
                                }
                            }
                        }
                    } else {
                        for (var c in confLayersMap) {
                            if (typeof layersEngine[c] !== 'undefined') {
                                currentResult = layersEngine[c].search(query);
                                if (filterBool) {
                                    currentResult = filterById(currentResult, filteredIds);
                                }
                                if (currentResult.length > 0) {
                                    results[c] = currentResult;
                                }
                            }
                        }
                    }

                } else if (searchConf.showAllByDefault || filteredIds.length) {
                    for (var l in confLayersMap) {
                        if (typeof layersEngine[l] !== 'undefined' &&
                            layers.indexOf(l) !== -1) {
                            currentResult = getAllByLayer(l);
                            if (filterBool) {
                                currentResult = filterById(currentResult, filteredIds);
                            }
                            if (currentResult.length > 0) {
                                results[l] = currentResult;
                            }
                        }
                    }
                }
                return results;
            };


            search.getAllGroupedByLayer = function (query) {
                var results = {},
                    currentResult = [];

                if (query) {
                    for (var c in confLayersMap) {
                        if (typeof layersEngine[c] !== 'undefined') {
                            currentResult = layersEngine[c].search(query);
                            if (currentResult.length > 0) {
                                results[c] = currentResult;
                            }
                        }
                    }
                } else if (searchConf.showAllByDefault) {
                    for (var l in confLayersMap) {
                        if (typeof layersEngine[l] !== 'undefined') {
                            results[l] = getAllByLayer(l);
                        }
                    }
                }
                return results;
            };


            var getFilteredFeaturesIds = function (type) {

                var allLayers = false;
                if (search.getActiveLayers().length === 0) {
                    allLayers = true;
                }
                var result = [];

                for (var superId in currentFilterMap) {
                    var filter = [];
                    var superCat = currentFilterMap[superId];
                    for (var macroId in superCat.sublayers) {
                        var macroCat = superCat.sublayers[macroId];
                        var cat = []
                        for (var catIndex in macroCat.items) {
                            var label = macroCat.items[catIndex].label;
                            if (macroCat.isMacroCategoryGroup) {
                                if (allLayers || activeLayersMap[label].state) {
                                    cat.push([label]);
                                }
                            } else {
                                if (allLayers || activeLayersMap[label].state) {
                                    cat.push(label);
                                }
                            }
                        }
                        if (cat.length) {
                            filter.push(cat);
                        }
                    }

                    var superIds = [];
                    for (var i = 0; i < filter.length; i++) {

                        var arrayOR = [];
                        for (var j = 0; j < filter[i].length; j++) {
                            var layerId = filter[i][j];
                            if (featuresIdByLayerMap[layerId]) {
                                arrayOR = arrayOR.concat(featuresIdByLayerMap[layerId]);
                            }
                        }

                        if (type || allLayers) {
                            if (superIds.length === 0 && i === 0) {
                                superIds = arrayOR;
                            } else {
                                superIds = superIds.concat(arrayOR);
                            }
                        } else {
                            if (superIds.length === 0 && i === 0) {
                                superIds = arrayOR;
                            } else {
                                superIds = superIds.filter(function (n) {
                                    return arrayOR.indexOf(n) > -1;
                                });
                            }
                        }

                    }
                    result = result.concat(superIds);
                }


                if (result && result.length) {
                    var tmp = result.filter(function (ele, pos, result) {
                        return result.indexOf(ele) === pos;
                    })
                    result = tmp;
                }

                return result;
            }


            var filterById = function (arrayIds, filterIds) {

                var newResult = [];
                for (var index in arrayIds) {
                    var id = arrayIds[index].id;
                    var filterId = filterIds.indexOf(id);
                    if (filterId > -1) {
                        newResult.push(arrayIds[index]);
                        filterIds.splice(filterId, 1);
                    }
                }
                return newResult;
            }

        } else {
            var setupEngine = function (layerName) {
                layersEngine[layerName] = new JsSearch.Search('id');

                if (searchConf.stemming) {
                    layersEngine[layerName].tokenizer = new JsSearch.StemmingTokenizer(stemmer, layersEngine[layerName].tokenizer);
                }
                if (searchConf.indexStrategy) {
                    layersEngine[layerName].indexStrategy = new JsSearch[searchConf.indexStrategy]();
                }
                if (searchConf.TFIDFRanking) {
                    layersEngine[layerName].searchIndex = new JsSearch.TfIdfSearchIndex('id');
                }
                for (var i in searchConf.indexFields) {
                    layersEngine[layerName].addIndex(['properties', searchConf.indexFields[i]]);
                }
            };

            var addToIndex = function (item, layerName) {
                var itemModel = {};

                itemModel = angular.extend({
                    id: item.properties.id || Utils.generateUID()
                }, item);
                layersEngine[layerName].addDocument(itemModel);
            };

            var getAllByLayer = function (layerName) {
                return layersEngine[layerName].documents_;
            };

            search.getActiveLayersMap = function () {
                return activeLayersMap;
            };

            search.getActiveLayers = function () {

                var res = [];
                for (var i in activeLayersMap) {
                    if (activeLayersMap[i].state) {
                        res.push(i);
                    }
                }

                return res;
            };

            search.setActiveAllLayers = function () {
                // for (var i in activeLayersMap) {
                //     activeLayersMap[i].state = true;
                // }
            };

            search.setActiveLayers = function (layersName) {
                if (typeof layersName === 'undefined') {
                    return;
                }

                for (var i in activeLayersMap) {
                    if (layersName.indexOf(i) !== -1) {
                        activeLayersMap[i].state = true;
                    } else {
                        activeLayersMap[i].state = false;
                    }
                }
            };

            search.clearEngine = function (layerName) {
                if (typeof confLayersMap[layerName] !== 'undefined' &&
                    typeof layersEngine[layerName] !== 'undefined') {
                    delete layersEngine[layerName];
                }
            }

            search.addToIndex = function (item, layerName) {
                if (typeof confLayersMap[layerName] !== 'undefined' &&
                    typeof layersEngine[layerName] === 'undefined') {
                    setupEngine(layerName);
                }

                if (typeof layersEngine[layerName] !== 'undefined') {
                    addToIndex(item, layerName);
                }
            };

            search.getByLayersWithDivider = function (query, layers) {
                var results = [],
                    currentResult = [];

                if (query) {
                    for (var c in confLayersMap) {
                        if (typeof layersEngine[c] !== 'undefined' &&
                            layers.indexOf(c) !== -1) {
                            currentResult = layersEngine[c].search(query);
                            if (currentResult.length > 0) {
                                results.push({
                                    label: c,
                                    divider: true
                                });
                                results = results.concat(currentResult);
                            }
                        }
                    }
                } else if (searchConf.showAllByDefault) {
                    for (var l in confLayersMap) {
                        if (typeof layersEngine[l] !== 'undefined' &&
                            layers.indexOf(l) !== -1) {
                            results.push({
                                label: l,
                                divider: true
                            });
                            results = results.concat(getAllByLayer(l));
                        }
                    }
                }

                return results;
            };

            search.getAllWithDivider = function (query) {
                return search.getByLayersWithDivider(query, confLayersList);
            };

            search.getByLayersGroupedByLayer = function (query, layers) {
                var results = {},
                    currentResult = [];

                if (query) {
                    for (var c in confLayersMap) {
                        if (typeof layersEngine[c] !== 'undefined' &&
                            layers.indexOf(c) !== -1) {
                            currentResult = layersEngine[c].search(query);
                            if (currentResult.length > 0) {
                                results[c] = currentResult;
                            }
                        }
                    }
                } else if (searchConf.showAllByDefault) {
                    for (var l in confLayersMap) {
                        if (typeof layersEngine[l] !== 'undefined' &&
                            layers.indexOf(l) !== -1) {
                            results[l] = getAllByLayer(l);
                        }
                    }
                }

                return results;
            };

            search.getAllGroupedByLayer = function (query) {
                var results = {},
                    currentResult = [];

                if (query) {
                    for (var c in confLayersMap) {
                        if (typeof layersEngine[c] !== 'undefined') {
                            currentResult = layersEngine[c].search(query);
                            if (currentResult.length > 0) {
                                results[c] = currentResult;
                            }
                        }
                    }
                } else if (searchConf.showAllByDefault) {
                    for (var l in confLayersMap) {
                        if (typeof layersEngine[l] !== 'undefined') {
                            results[l] = getAllByLayer(l);
                        }
                    }
                }


                return results;
            };

        }
        return search;
    });