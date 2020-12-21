/*global angular, JsSearch, stemmer*/

angular
  .module("webmapp")

  .factory("Search", function Search(Utils, CONFIG) {
    var search = {},
      layersEngine = {},
      searchConf = CONFIG.SEARCH,
      confLayers = CONFIG.OVERLAY_LAYERS;

    var confLayersList = confLayers.map(function (layer) {
      return layer.label;
    });

    var confLayersMap = confLayers.reduce(function (prev, curr) {
      prev[curr.label] = true;
      return prev;
    }, {});

    var confLayersMapById = confLayers.reduce(function (prev, curr) {
      prev[curr.id] = curr;
      return prev;
    }, {});

    var activeLayersMap = confLayers.reduce(function (prev, curr) {
      if (!curr.skipSearch) {
        prev[curr.label] = { state: false };
      }
      return prev;
    }, {});

    if (CONFIG.MAP.filters) {
      var currentFilterMap = angular.copy(CONFIG.MAP.filters);
      var macroCategoryMap = {};
      var categoryMap = {};
      for (var superCategoryId in currentFilterMap) {
        if (
          superCategoryId !== "base_maps" &&
          currentFilterMap[superCategoryId].sublayers
        ) {
          var sublayers = currentFilterMap[superCategoryId].sublayers;

          for (macroCategoryId in sublayers) {
            if (
              sublayers[macroCategoryId].items &&
              sublayers[macroCategoryId].items.length
            ) {
              macroCategoryMap[sublayers[macroCategoryId].label.it] = {};
              var layers = sublayers[macroCategoryId].items;
              for (var layerId in layers) {
                var label = confLayersMapById[layers[layerId]].label;
                if (activeLayersMap[label]) {
                  if (
                    label === "Aziende" ||
                    label === "Ricette" ||
                    label === "Post"
                  )
                    activeLayersMap[label].state = true;

                  layers[layerId] = { label: label, id: layers[layerId] };
                  macroCategoryMap[sublayers[macroCategoryId].label.it][label] =
                    activeLayersMap[label];
                  categoryMap[label] = {
                    state: activeLayersMap[label],
                    macroCategory: sublayers[macroCategoryId].label.it,
                  };
                }
              }
            } else delete sublayers[macroCategoryId];
          }
        } else delete currentFilterMap[superCategoryId];
      }

      var featuresIdByLayerMap = {};
      search.setFeaturesIdByLayerMap = function (newMap) {
        if (typeof newMap === "undefined") return;
        featuresIdByLayerMap = newMap;
      };

      var setupEngine = function (layerName) {
        layersEngine[layerName] = new JsSearch.Search("id");

        if (searchConf.stemming) {
          layersEngine[layerName].tokenizer = new JsSearch.StemmingTokenizer(
            stemmer,
            layersEngine[layerName].tokenizer
          );
        }
        if (searchConf.indexStrategy) {
          layersEngine[layerName].indexStrategy = new JsSearch[
            searchConf.indexStrategy
          ]();
        }
        if (searchConf.TFIDFRanking) {
          layersEngine[layerName].searchIndex = new JsSearch.TfIdfSearchIndex(
            "id"
          );
        }

        for (var i in searchConf.indexFields) {
          layersEngine[layerName].addIndex([
            "properties",
            searchConf.indexFields[i],
          ]);
        }
      };

      var addToIndex = function (item, layerName) {
        var itemModel = {};

        itemModel = angular.extend(
          { id: item.properties.id || Utils.generateUID() },
          item
        );
        layersEngine[layerName].addDocument(itemModel);
      };

      var getAllByLayer = function (layerName) {
        return layersEngine[layerName].documents_;
      };

      search.getActiveLayers = function () {
        var res = [];

        for (var i in activeLayersMap) {
          if (activeLayersMap[i].state) res.push(i);
        }
        return res;
      };

      search.getActiveLayersMap = function () {
        return activeLayersMap;
      };

      search.setActiveLayers = function (layersName) {
        if (typeof layersName === "undefined") return;

        for (var i in activeLayersMap) {
          if (layersName.indexOf(i) !== -1) activeLayersMap[i].state = true;
          else activeLayersMap[i].state = false;
        }
      };

      search.addToIndex = function (item, layerName) {
        if (
          typeof confLayersMap[layerName] !== "undefined" &&
          typeof layersEngine[layerName] === "undefined"
        )
          setupEngine(layerName);

        if (typeof layersEngine[layerName] !== "undefined")
          addToIndex(item, layerName);
      };

      search.getByLayersWithDivider = function (query, layers) {
        var results = [],
          currentResult = [];

        var filteredIds = getFilteredFeaturesIds();

        if (query) {
          if (!filteredIds.length) {
            for (var c in confLayersMap) {
              if (typeof layersEngine[c] !== "undefined") {
                currentResult = layersEngine[c].search(query);
                if (currentResult.length > 0) {
                  results.push({ label: c, divider: true });
                  results = results.concat(currentResult);
                }
              }
            }
          } else {
            for (var c in confLayersMap) {
              if (typeof layersEngine[c] !== "undefined") {
                currentResult = layersEngine[c].search(query);
                if (filteredIds.length)
                  currentResult = filterById(currentResult, filteredIds);
                if (currentResult.length > 0) {
                  results.push({ label: c, divider: true });
                  results = results.concat(currentResult);
                }
              }
            }
          }
        } else if (searchConf.showAllByDefault || filteredIds.length) {
          for (var l in confLayersMap) {
            if (typeof layersEngine[l] !== "undefined") {
              currentResult = getAllByLayer(l);
              if (filteredIds.length)
                currentResult = filterById(currentResult, filteredIds);
              if (currentResult.length > 0) {
                results.push({ label: l, divider: true });
                results = results.concat(currentResult);
              }
            }
          }
        }

        return results;
      };

      search.getByLayersLexicalOrder = function (query) {
        var atLeastOnefilter = false;
        var results = [];
        for (const key in activeLayersMap) {
          if (activeLayersMap[key].state) {
            atLeastOnefilter = true;
            break;
          }
        }

        if (!atLeastOnefilter && !query) return results;

        var currentResult = [];

        var additionalFilter = searchForQueryFilters(query);
        query = updateQuery(query, additionalFilter.wordsToRemove);
        var filteredIds = getFilteredFeaturesIds(false, additionalFilter);

        for (const key in activeLayersMap) {
          if (additionalFilter[key]) {
            atLeastOnefilter = true;
            break;
          }
        }

        if (atLeastOnefilter && !filteredIds.length) return results;

        if (query) {
          for (var c in confLayersMap) {
            if (typeof layersEngine[c] !== "undefined") {
              currentResult = layersEngine[c].search(query);
              if (atLeastOnefilter)
                currentResult = filterById(currentResult, filteredIds);
              if (currentResult.length > 0)
                results = results.concat(currentResult);
            }
          }
        } else {
          for (var l in confLayersMap) {
            if (typeof layersEngine[l] !== "undefined") {
              currentResult = getAllByLayer(l);
              currentResult = filterById(currentResult, filteredIds);
              if (currentResult.length > 0)
                results = results.concat(currentResult);
            }
          }
        }

        results.sort(function (a, b) {
          var aName = a.properties.name.toLocaleUpperCase();

          var bName = b.properties.name.toLocaleUpperCase();
          if (/^[a-zA-Z]/.test(aName) && /^[a-zA-Z]/.test(bName))
            return aName.localeCompare(bName);
          else {
            if (/^[a-zA-Z]/.test(aName)) return 1;
            else if (/^[a-zA-Z]/.test(bName)) return -1;
            else return aName.localeCompare(bName);
          }
        });

        var char = "empty";
        for (let i = 0; i < results.length; i++) {
          var el = results[i];
          var currentChar = el.properties.name[0].toLocaleUpperCase();
          if (char === "empty") {
            if (!/^[a-zA-Z]/.test(currentChar)) char = "*";
            else char = currentChar;

            results.unshift({ label: char.toLocaleUpperCase(), divider: true });
          }

          if (currentChar !== char && /^[a-zA-Z]/.test(currentChar)) {
            results.splice(i, 0, { label: currentChar, divider: true });
            char = currentChar;
          }
        }

        return results;
      };

      search.getFeatures = function (query) {
        var results = [],
          currentResult = [];

        var filteredIds = getFilteredFeaturesIds();
        if (query) {
          for (var c in confLayersMap) {
            if (typeof layersEngine[c] !== "undefined") {
              currentResult = layersEngine[c].search(query);
              if (filteredIds.length)
                currentResult = filterById(currentResult, filteredIds);
              if (currentResult.length > 0)
                results = results.concat(currentResult);
            }
          }
        } else {
          for (var l in confLayersMap) {
            if (typeof layersEngine[l] !== "undefined") {
              currentResult = getAllByLayer(l);
              if (filteredIds.length)
                currentResult = filterById(currentResult, filteredIds);
              if (currentResult.length > 0)
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

        var additionalFilter = searchForQueryFilters(query);
        query = updateQuery(query, additionalFilter.wordsToRemove);
        var idsFilter = getFilteredFeaturesIds(false, additionalFilter);
        if (query) {
          if (!idsFilter.length) {
            for (var c in confLayersMap) {
              if (typeof layersEngine[c] !== "undefined") {
                currentResult = layersEngine[c].search(query);
                if (currentResult.length > 0) results[c] = currentResult;
              }
            }
          } else {
            for (var c in confLayersMap) {
              if (typeof layersEngine[c] !== "undefined") {
                currentResult = layersEngine[c].search(query);
                if (idsFilter.length)
                  currentResult = filterById(currentResult, idsFilter);
                if (currentResult.length > 0) results[c] = currentResult;
              }
            }
          }
        } else if (searchConf.showAllByDefault || idsFilter.length) {
          for (var l in confLayersMap) {
            if (typeof layersEngine[l] !== "undefined") {
              currentResult = getAllByLayer(l);
              if (idsFilter.length) {
                currentResult = filterById(currentResult, idsFilter);
              }
              if (currentResult.length > 0) {
                results[l] = currentResult;
              }
            }
          }
        }
        return results;
      };

      search.getLayersFilteredByIds = function (ids) {
        var results = {},
          currentResult = [];

        var idFilter = ids;
        for (var l in confLayersMap) {
          if (typeof layersEngine[l] !== "undefined") {
            currentResult = getAllByLayer(l);
            currentResult = filterById(currentResult, idFilter);
            if (currentResult.length > 0) {
              results[l] = currentResult;
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
            if (typeof layersEngine[c] !== "undefined") {
              currentResult = layersEngine[c].search(query);
              if (currentResult.length > 0) {
                results[c] = currentResult;
              }
            }
          }
        } else if (searchConf.showAllByDefault) {
          for (var l in confLayersMap) {
            if (typeof layersEngine[l] !== "undefined") {
              results[l] = getAllByLayer(l);
            }
          }
        }
        return results;
      };

      var getFilteredFeaturesIds = function (type, additionalFilter) {
        var result = [];
        var filter = [];
        additionalFilter =
          typeof additionalFilter === "undefined" ? {} : additionalFilter;
        for (var superId in currentFilterMap) {
          var superCat = currentFilterMap[superId];
          for (var macroId in superCat.sublayers) {
            var macroCat = superCat.sublayers[macroId];
            var cat = [];
            for (var catIndex in macroCat.items) {
              var label = macroCat.items[catIndex].label;
              if (macroCat.label === "custom") {
                if (activeLayersMap[label].state || additionalFilter[label]) {
                  cat.push([label]);
                }
              } else {
                if (activeLayersMap[label].state || additionalFilter[label]) {
                  cat.push(label);
                }
              }
            }
            if (cat.length) {
              filter.push(cat);
            }
          }
        }

        for (var i = 0; i < filter.length; i++) {
          var arrayOR = [];
          for (var j = 0; j < filter[i].length; j++) {
            var layerId = filter[i][j];
            arrayOR = arrayOR.concat(featuresIdByLayerMap[layerId]);
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
              result = result.filter(function (n) {
                return arrayOR.indexOf(n) > -1;
              });
            }
          }
        }
        return result;
      };

      var filterById = function (result, idArray) {
        var newResult = [];
        for (var index in result) {
          var id = result[index].id;
          if (idArray.indexOf(id) > -1) {
            newResult.push(result[index]);
          }
        }

        return newResult;
      };

      var searchForQueryFilters = function (query) {
        if (!query) {
          return {};
        }

        var additionalFilter = {};
        additionalFilter.wordsToRemove = [];

        var dictionary = {
          Aziende: ["aziende", "azienda"],
          Post: ["post", "posts"],
          Ricette: ["ricetta", "ricette"],
          Arezzo: ["arezzo"],
          Firenze: ["firenze"],
          Grosseto: ["grosseto"],
          Livorno: ["livorno"],
          Lucca: ["lucca"],
          "Massa e Carrara": [
            "massa e carrara",
            "massa",
            "carrara",
            "massa carrara",
          ],
          Pisa: ["pisa"],
          Pistoia: ["pistoia"],
          Prato: ["prato"],
          Siena: ["siena"],
        };

        var lowerQuery = query.toLocaleLowerCase();
        for (var filter in dictionary) {
          var macroCatLabel = categoryMap[filter].macroCategory,
            categories = macroCategoryMap[macroCatLabel];

          // var check = false;
          // for (var categoryLabel in categories) {

          //     if (categoryLabel !== filter && categories[categoryLabel] && categories[ca) {
          //         check = true;
          //         break;
          //     }
          // }

          // if (!check) {
          var words = dictionary[filter];
          for (let i = 0; i < words.length; i++) {
            var word = words[i];
            if (lowerQuery.indexOf(word) != -1) {
              additionalFilter[filter] = true;
              if (additionalFilter.wordsToRemove.indexOf(word) === -1) {
                additionalFilter.wordsToRemove.push(word);
              }
            }
          }
          // }
        }

        return additionalFilter;
      };

      var updateQuery = function (query, wordsToRemove) {
        if (!query || !wordsToRemove) return query;

        var editedQuery = query;

        for (let i = 0; i < wordsToRemove.length; i++) {
          var word = wordsToRemove[i];
          editedQuery = editedQuery.replace(new RegExp(word, "gi"), "");
          editedQuery = editedQuery.trim();
        }

        return editedQuery;
      };

      search.updateQuery = function (query, wordsToRemove) {
        return updateQuery(query, wordsToRemove);
      };

      search.searchForQueryFilters = function (query) {
        return searchForQueryFilters(query);
      };
    } else {
      var setupEngine = function (layerName) {
        layersEngine[layerName] = new JsSearch.Search("id");

        if (searchConf.stemming) {
          layersEngine[layerName].tokenizer = new JsSearch.StemmingTokenizer(
            stemmer,
            layersEngine[layerName].tokenizer
          );
        }
        if (searchConf.indexStrategy) {
          layersEngine[layerName].indexStrategy = new JsSearch[
            searchConf.indexStrategy
          ]();
        }
        if (searchConf.TFIDFRanking) {
          layersEngine[layerName].searchIndex = new JsSearch.TfIdfSearchIndex(
            "id"
          );
        }
        for (var i in searchConf.indexFields) {
          layersEngine[layerName].addIndex([
            "properties",
            searchConf.indexFields[i],
          ]);
        }
      };

      var addToIndex = function (item, layerName) {
        var itemModel = {};

        itemModel = angular.extend(
          { id: item.properties.id || Utils.generateUID() },
          item
        );
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
        for (var i in activeLayersMap) {
          activeLayersMap[i].state = true;
        }
      };

      search.setActiveLayers = function (layersName) {
        if (typeof layersName === "undefined") return;

        for (var i in activeLayersMap) {
          if (layersName.indexOf(i) !== -1) {
            activeLayersMap[i].state = true;
          } else {
            activeLayersMap[i].state = false;
          }
        }
      };

      search.addToIndex = function (item, layerName) {
        if (
          typeof confLayersMap[layerName] !== "undefined" &&
          typeof layersEngine[layerName] === "undefined"
        ) {
          setupEngine(layerName);
        }

        if (typeof layersEngine[layerName] !== "undefined") {
          addToIndex(item, layerName);
        }
      };

      search.getByLayersWithDivider = function (query, layers) {
        var results = [],
          currentResult = [];

        if (query) {
          for (var c in confLayersMap) {
            if (
              typeof layersEngine[c] !== "undefined" &&
              layers.indexOf(c) !== -1
            ) {
              currentResult = layersEngine[c].search(query);
              if (currentResult.length > 0) {
                results.push({ label: c, divider: true });
                results = results.concat(currentResult);
              }
            }
          }
        } else if (searchConf.showAllByDefault) {
          for (var l in confLayersMap) {
            if (
              typeof layersEngine[l] !== "undefined" &&
              layers.indexOf(l) !== -1
            ) {
              results.push({ label: l, divider: true });
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
            if (
              typeof layersEngine[c] !== "undefined" &&
              layers.indexOf(c) !== -1
            ) {
              currentResult = layersEngine[c].search(query);
              if (currentResult.length > 0) {
                results[c] = currentResult;
              }
            }
          }
        } else if (searchConf.showAllByDefault) {
          for (var l in confLayersMap) {
            if (
              typeof layersEngine[l] !== "undefined" &&
              layers.indexOf(l) !== -1
            ) {
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
            if (typeof layersEngine[c] !== "undefined") {
              currentResult = layersEngine[c].search(query);
              if (currentResult.length > 0) {
                results[c] = currentResult;
              }
            }
          }
        } else if (searchConf.showAllByDefault) {
          for (var l in confLayersMap) {
            if (typeof layersEngine[l] !== "undefined") {
              results[l] = getAllByLayer(l);
            }
          }
        }

        return results;
      };
    }
    return search;
  });
