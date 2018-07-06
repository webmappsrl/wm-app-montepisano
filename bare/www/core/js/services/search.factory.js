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

    var confLayersList = confLayers.map(function(layer) {
        return layer.label;
    });

    var confLayersMap = confLayers.reduce(function(prev, curr) {
        prev[curr.label] = true;
        return prev;
    }, {});

    var activeLayersMap = confLayers.reduce(function(prev, curr) {
        if (!curr.skipSearch) {
            prev[curr.label] = false;
        }
        return prev;
    }, {});

    var setupEngine = function(layerName) {
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

    var addToIndex = function(item, layerName) {
        var itemModel = {};

        itemModel = angular.extend({ id: item.properties.id || Utils.generateUID() }, item);
        layersEngine[layerName].addDocument(itemModel);
    };

    var getAllByLayer = function(layerName) {
        return layersEngine[layerName].documents_;
    };

    search.getActiveLayersMap = function() {
        return activeLayersMap;
    };

    search.getActiveLayers = function() {
        var res = [];

        for (var i in activeLayersMap) {
            if (activeLayersMap[i]) {
                res.push(i);
            }
        }

        return res;
    };

    search.setActiveAllLayers = function() {
        for (var i in activeLayersMap) {
            activeLayersMap[i] = true;
        }
    };

    search.setActiveLayers = function(layersName) {
        if (typeof layersName === 'undefined') {
            return;
        }

        for (var i in activeLayersMap) {
            if (layersName.indexOf(i) !== -1) {
                activeLayersMap[i] = true;
            } else {
                activeLayersMap[i] = false;
            }
        }
    };

    search.addToIndex = function(item, layerName) {
        if (typeof confLayersMap[layerName] !== 'undefined' &&
            typeof layersEngine[layerName] === 'undefined') {
            setupEngine(layerName);
        }

        if (typeof layersEngine[layerName] !== 'undefined') {
            addToIndex(item, layerName);

        }
    };

    search.getByLayersWithDivider = function(query, layers) {
        var results = [],
            currentResult = [];


        // if (query) {
        //     for (var c in confLayersMap) {
        //         if (typeof layersEngine[c] !== 'undefined' &&
        //             layers.indexOf(c) !== -1) {
        //             currentResult = layersEngine[c].search(query);

        //             if (currentResult.length > 0) {
        //                 results.push({ label: c, divider: true });
        //                 results = results.concat(currentResult);
        //             }
        //         }
        //     }
        // } else if (searchConf.showAllByDefault) {
        //     for (var l in confLayersMap) {
        //         if (typeof layersEngine[l] !== 'undefined' &&
        //             layers.indexOf(l) !== -1) {
        //             results.push({ label: l, divider: true });
        //             results = results.concat(getAllByLayer(l));
        //         }
        //     }
        // }
        var idFilter = facetedFilterFun(facetedFilters);
        console.log(facetedFilters);

        // console.log(idFilter);
        if (query) {
            if (!facetedFilters.length) {
                for (var c in confLayersMap) {
                    if (typeof layersEngine[c] !== 'undefined') {
                        currentResult = layersEngine[c].search(query);
                        if (currentResult.length > 0) {
                            results.push({ label: c, divider: true });
                            results = results.concat(currentResult);
                        }
                    }
                }
            } else {
                for (var c in confLayersMap) {
                    if (typeof layersEngine[c] !== 'undefined') {
                        currentResult = layersEngine[c].search(query);
                        if (facetedFilters.length) {
                            currentResult = filterById(currentResult, idFilter);
                        }
                        if (currentResult.length > 0) {
                            results.push({ label: c, divider: true });
                            results = results.concat(currentResult);
                        }
                    }
                }
            }
        } else if (searchConf.showAllByDefault || facetedFilters.length) {
            for (var l in confLayersMap) {
                if (typeof layersEngine[l] !== 'undefined') {
                    currentResult = getAllByLayer(l);
                    if (facetedFilters.length) {
                        currentResult = filterById(currentResult, idFilter);
                    }
                    if (currentResult.length > 0) {
                        results.push({ label: l, divider: true });
                        results = results.concat(currentResult);
                    }
                }
            }
        }


        return results;
    };


    search.getAllWithDivider = function(query) {
        return search.getByLayersWithDivider(query, confLayersList);
    };

    search.getByLayersGroupedByLayer = function(query, layers) {
        var results = {},
            currentResult = [];

        // if (query) {
        //     for (var c in confLayersMap) {
        //         if (typeof layersEngine[c] !== 'undefined' &&
        //             layers.indexOf(c) !== -1) {
        //             currentResult = layersEngine[c].search(query);

        //             if (currentResult.length > 0) {
        //                 results[c] = currentResult;
        //             }
        //         }
        //     }
        // } else if (searchConf.showAllByDefault) {
        //     for (var l in confLayersMap) {
        //         if (typeof layersEngine[l] !== 'undefined' &&
        //             layers.indexOf(l) !== -1) {
        //             results[l] = getAllByLayer(l);
        //         }
        //     }
        // }

        var idFilter = [];
        if (facetedFilters.length) {
            idFilter = facetedFilterFun(facetedFilters);
        }

        if (query) {

            if (!facetedFilters.length) {
                for (var c in confLayersMap) {
                    if (typeof layersEngine[c] !== 'undefined') {
                        currentResult = layersEngine[c].search(query);
                        if (currentResult.length > 0) {
                            results[c] = currentResult;
                        }
                    }
                }
            } else {
                for (var c in confLayersMap) {
                    if (typeof layersEngine[c] !== 'undefined') {
                        currentResult = layersEngine[c].search(query);
                        if (facetedFilters.length) {
                            currentResult = filterById(currentResult, idFilter);
                        }
                        if (currentResult.length > 0) {
                            results[c] = currentResult;
                        }
                    }
                }
            }

        } else if (searchConf.showAllByDefault || facetedFilters.length) {

            for (var l in confLayersMap) {
                if (typeof layersEngine[l] !== 'undefined') {
                    currentResult = getAllByLayer(l);

                    if (facetedFilters.length) {
                        currentResult = filterById(currentResult, idFilter);
                    }
                    if (currentResult.length > 0) {
                        results[l] = currentResult;
                    }
                }
            }
        }



        return results;
    };

    search.getLayersFilteredByIds = function(ids) {
        var results = {},
            currentResult = [];

        var idFilter = ids;

        for (var l in confLayersMap) {
            if (typeof layersEngine[l] !== 'undefined') {
                currentResult = getAllByLayer(l);


                currentResult = filterById(currentResult, idFilter);

                if (currentResult.length > 0) {
                    results[l] = currentResult;
                }
            }
        }

        return results;
    };

    search.getAllGroupedByLayer = function(query) {
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



    var facetedFilters = [];
    var featuresIdByLayer = [];
    search.setFacetedFilters = function(filters, featuresIdMap) {
        if (typeof filters === 'undefined' || typeof featuresIdByLayer === 'undefined') {
            return;
        }

        facetedFilters = filters;
        featuresIdByLayer = featuresIdMap;

    }

    var facetedFilterFun = function(binds, type) {

        var result = [];

        var filter = typeof binds !== "undefined" ? binds : [];

        for (var i = 0; i < filter.length; i++) {

            var arrayOR = [];
            for (var j = 0; j < filter[i].length; j++) {
                var layerId = filter[i][j];
                console.log(layerId);
                console.log(featuresIdByLayer);
                console.log(featuresIdByLayer[layerId]);
                arrayOR = arrayOR.concat(featuresIdByLayer[layerId]);

            }

            if (type) {
                if (result.length === 0 && i === 0) {
                    result = arrayOR;
                } else {
                    result = result.concat(arrayOR);
                }
            } else {
                if (result.length === 0 && i === 0) {
                    result = arrayOR;
                } else {
                    result = result.filter(function(n) {
                        return arrayOR.indexOf(n) > -1;
                    });
                }
            }
        }

        return result;
    }


    var filterById = function(result, idArray) {

        var newResult = [];
        for (var index in result) {
            var id = result[index].id;
            if (idArray.indexOf(id) > -1) {
                newResult.push(result[index]);
            }
        }

        return newResult;

    }

    return search;
});