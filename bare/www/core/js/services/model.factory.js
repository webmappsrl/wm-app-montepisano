/*global angular*/

angular.module('webmapp')

.factory('Model', function Model(
    $http,
    $rootScope,
    CONFIG,
    Utils,
    Search
) {
    var model = {};

    var overlaysMap = {},
        overlaysGroupMap = {},
        overlaysChildMap = {},
        pagesMap = {},
        pagesMapByType = {},
        pagesGroupMap = {},
        pagesChildMap = {},
        genericItemsMap = {},
        confMainMenuMap = {};

    var mainMenuItems = CONFIG.MENU,
        confPages = CONFIG.PAGES,
        confOverlays = CONFIG.OVERLAY_LAYERS,
        colorsConfig = CONFIG.STYLE;

    for (var p in confPages) {
        pagesMap[confPages[p].label] = angular.extend({ items: [] }, confPages[p]);
        pagesMapByType[confPages[p].type] = confPages[p];
    }

    for (var n in confOverlays) {
        if (!confOverlays[n].skipRedering) {
            overlaysMap[confOverlays[n].label] = angular.extend({ items: [] }, confOverlays[n]);
        }
    }

    for (var i in mainMenuItems) {
        confMainMenuMap[mainMenuItems[i].label] = mainMenuItems[i];
        if (mainMenuItems[i].type === 'layerGroup') {
            overlaysGroupMap[mainMenuItems[i].label] = mainMenuItems[i];
            for (var c in mainMenuItems[i].items) {
                overlaysChildMap[mainMenuItems[i].items[c]] = overlaysMap[mainMenuItems[i].items[c]];
            }
        }
        if (mainMenuItems[i].type === 'pageGroup') {
            pagesGroupMap[mainMenuItems[i].label] = mainMenuItems[i];
            for (var c in mainMenuItems[i].items) {
                pagesChildMap[mainMenuItems[i].items[c]] = pagesMap[mainMenuItems[i].items[c]];
            }
        }
    }

    model.isLayerInMenu = function(label) {
        return confMainMenuMap[label] || overlaysChildMap[label];
    };

    model.getItemType = function(label) {
        if (typeof overlaysGroupMap[label] !== 'undefined') {
            return 'layerGroup';
        }
        if (typeof overlaysMap[label] !== 'undefined') {
            return 'layer';
        }
        if (typeof pagesGroupMap[label] !== 'undefined') {
            return 'pageGroup';
        }
        if (typeof pagesMap[label] !== 'undefined') {
            return 'page';
        }
    };

    model.buildItemUrl = function(item) {
        var realUrl = item.label ? item.label.replace(/ /g, '_') : "";
        realType = item.type,
            separator = '/';

        if (!realType) {
            realType = model.getItemType(realUrl);
            realType = typeof realType !== "undefined" ? realType : "";
        }

        if (realType === 'layerGroup') {
            realType = 'layer';
        } else if (realType === 'pageGroup') {
            realType = 'pages';
        } else if (realType === 'internalLink') {
            realUrl = item.url;
            realType = separator = '';
        } else if (realType === 'closeMap') {
            realType = realUrl = separator = '';
        } else if (realType === 'page') {
            realUrl = pagesMap[item.label].type;
            realType = separator = '';
        }

        if (realType === "packages") {
            realUrl = "";
        }

        return realType + separator + realUrl;
    };

    model.getOverlayParent = function(name) {
        for (var parent in overlaysGroupMap) {
            for (var child in overlaysGroupMap[parent].items) {
                if (overlaysMap[overlaysGroupMap[parent].items[child]].label === name) {
                    return overlaysGroupMap[parent];
                }
            }
        }
    };

    model.getPageParent = function(name) {
        for (var parent in pagesGroupMap) {
            for (var child in pagesGroupMap[parent].items) {
                if (pagesMap[pagesGroupMap[parent].items[child]].label === name) {
                    return pagesGroupMap[parent];
                }
            }
        }
    };

    model.getLayersMap = function() {
        return overlaysMap;
    };

    model.getPagesMap = function() {
        return pagesMap;
    };

    model.isAChild = function(name) {
        return overlaysChildMap[name];
    };

    model.isAPageChild = function(name) {
        return pagesChildMap[name];
    };

    model.isAnOverlayGroup = function(name) {
        return overlaysGroupMap[name];
    };

    model.isAPageGroup = function(name) {
        return pagesGroupMap[name];
    };

    model.isAPage = function(name) {
        if (name.indexOf('.') !== -1) {
            name = name.split('.')[name.split('.').length - 1];
        }

        return name === 'pages' || pagesMap[name] || pagesMapByType[name];
    };

    model.getOverlay = function(name) {
        return overlaysMap[name];
    };

    model.getPage = function(name) {
        return pagesMap[name];
    };

    model.getPageByType = function(type) {
        return pagesMapByType[type];
    };

    model.getOverlaysGroupMap = function() {
        return overlaysGroupMap;
    };

    model.getOverlaysMap = function() {
        return overlaysMap;
    };

    model.getItemsByContaier = function(containerName) {
        return genericItemsMap[containerName];
    };

    model.getItemsByContaierAndId = function(itemId, containerName) {
        if (typeof genericItemsMap[containerName] !== 'undefined') {
            return genericItemsMap[containerName][itemId];
        }
    };

    model.addItemToContaier = function(item, containerName) {
        if (typeof genericItemsMap[containerName] === 'undefined') {
            genericItemsMap[containerName] = {};
        }
        genericItemsMap[containerName][item.id || Utils.generateUID()] = item;
    };

    model.addItemToLayer = function(item, layer) {
        if (typeof item.properties !== 'undefined' &&
            typeof overlaysMap[layer.label] !== 'undefined') {
            if (typeof item.properties.name === 'undefined') {
                item.properties.name = item.properties.ref;
            }
            if (CONFIG.SEARCH && CONFIG.SEARCH.active && !layer.skipSearch) {
                Search.addToIndex(item, layer.label);
            }
            overlaysMap[layer.label].items.push(item);
        }
    };

    model.getMenuMap = function() {
        return confMainMenuMap;
    };

    model.getMenuColor = function(name) {
        if (typeof confMainMenuMap[name] !== 'undefined') {
            return confMainMenuMap[name].color;
        } else {
            if (model.isAChild(name)) {
                return overlaysChildMap[name].color ||
                    model.getOverlayParent(name).color;
            }
        }

        return colorsConfig.mainBar.color;
    };

    model.getListColor = function(name) {
        if (typeof confMainMenuMap[name] !== 'undefined') {
            if (confMainMenuMap[name].color) {
                return confMainMenuMap[name].color;
            }
            if (CONFIG.MAIN) {
                return CONFIG.MAIN.STYLE.menu.color;
            }
            return CONFIG.STYLE.menu.color;
        } else {
            if (model.isAChild(name)) {
                return overlaysChildMap[name].color ||
                    model.getOverlayParent(name).color;
            } else if (model.isAPageChild(name)) {
                return pagesChildMap[name].color ||
                    model.getPageParent(name).color;
            }
        }

        return colorsConfig.global.color;
    };

    return model;
});