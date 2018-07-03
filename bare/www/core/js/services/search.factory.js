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
            prev[curr.label] = true;
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

        if (query) {
            for (var c in confLayersMap) {
                if (typeof layersEngine[c] !== 'undefined' &&
                    layers.indexOf(c) !== -1) {
                    currentResult = layersEngine[c].search(query);
                    if (currentResult.length > 0) {
                        results.push({ label: c, divider: true });
                        results = results.concat(currentResult);
                    }
                }
            }
        } else if (searchConf.showAllByDefault) {
            for (var l in confLayersMap) {
                if (typeof layersEngine[l] !== 'undefined' &&
                    layers.indexOf(l) !== -1) {
                    results.push({ label: l, divider: true });
                    results = results.concat(getAllByLayer(l));
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

    return search;
});