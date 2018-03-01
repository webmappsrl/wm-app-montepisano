/*global $, ionic, L, angular*/

angular.module('webmapp')

.factory('MapService', function MapService(
    $rootScope,
    $timeout,
    $q,
    Model,
    $state,
    $ionicPopup,
    $ionicModal,
    $ionicLoading,
    $ionicPlatform,
    Utils,
    Offline,
    CONFIG,
    $translate
) {
    var mapService = {};

    var map = null,
        baseView = {},
        layerControl = null,
        mapConf = CONFIG.MAP,
        menuConf = CONFIG.MENU,
        generalConf = CONFIG.OPTIONS,
        overlayLayersConf = CONFIG.OVERLAY_LAYERS,
        styleConf = CONFIG.STYLE,
        offlineConf = CONFIG.OFFLINE,
        currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";

    var eventsList = [],
        eventsMap = {},
        couponsList = [],
        couponsMap = {},
        dataReady = false,
        layerCliked = null,
        useLocalCaching = generalConf.useLocalStorageCaching,
        centerCoords = {},
        centerCoordsUTM32 = {},
        singleFeatureUrl = CONFIG.COMMUNICATION ? CONFIG.COMMUNICATION.singleFeatureUrl : null,
        eventsPromise, couponsPromise, pagePromise, positionMarker, positionCircle;

    var baseLayersByLabel = {},
        tileLayersByLabel = {},
        utfGridBaseLayerByLabel = {},
        utfGridOverlayLayersByLabel = {},
        overlayLayersByLabel = {},
        extraLayersByLabel = {},
        featureMapById = {},
        areaMapById = {},
        geojsonByLabel = {},
        itineraryRefByFeatureId = {};

    var overlayLayersQueueByLabel = {},
        queueLayerToActivate = null,
        queueEvents = false,
        markerClusters;

    var updateHitsTimer;

    var skipAreaClick = null;

    var polylineDecoratorLayers = {};

    var activatedPopup = null,
        mapIsRotating = false;

    var controlLocate = null;
    var circleLocation = {
        position: null,
        accuracy: null
    };
    var locationIcon  = L.icon({
        iconUrl: 'core/images/location-icon.png',

        iconSize: [40, 40],
        iconAnchor: [20, 20],
    });

    var arrowIcon  = L.icon({
        iconUrl: 'core/images/arrow-icon.png',

        iconSize: [10, 14],
        iconAnchor: [5, 7],
    });

    var db = new PouchDB('webmapp');

    // for (var i in overlayLayersConf) {
    //     if (overlayLayersConf[i].skipRendering) {
    //         delete overlayLayersConf[i];
    //     }
    // }

    var overlayLayersConfMap = overlayLayersConf.reduce(function(prev, curr) {
        prev[curr.label] = curr;
        return prev;
    }, {});

    var groupConfMap = menuConf.reduce(function(prev, curr) {
        if (curr.type === 'layerGroup') {
            curr.layer = L.featureGroup();
            prev[curr.label] = curr;
        }
        return prev;
    }, {});

    var activeFilters = localStorage.activeFilters ?
        JSON.parse(localStorage.activeFilters) : overlayLayersConf.reduce(function(prev, curr) {
            if (!curr.skipRendering) {
                prev[curr.label] = curr.showByDefault !== false;
            }
            return prev;
        }, {});

    var isAPOILayer = function(layerName) {
        return (overlayLayersConfMap[layerName] &&
                overlayLayersConfMap[layerName].type === 'poi_geojson') ||
            (extraLayersByLabel[layerName] &&
                extraLayersByLabel[layerName].type === 'poi_geojson');
    };

    var isALineLayer = function(layerName) {
        return (overlayLayersConfMap[layerName] &&
                overlayLayersConfMap[layerName].type === 'line_geojson') ||
            (extraLayersByLabel[layerName] &&
                extraLayersByLabel[layerName].type === 'line_geojson');
    };

    var getParentGroup = function(layerName) {
        var group;

        for (var i in groupConfMap) {
            if (groupConfMap[i].items.indexOf(layerName) !== -1) {
                group = groupConfMap[i];
                break;
            }
        }

        return group;
    };

    var getLayerByName = function(layerName) {
        return overlayLayersByLabel[layerName] ||
            extraLayersByLabel[layerName];
    };

    var fitBounds = function(bounds) {
        if (bounds && bounds.isValid()) {
            map.fitBounds(bounds, {
                // paddingTopLeft: L.point(0, map.getSize().divideBy(2).y),
                animate: true,
                duration: 1,
                easeLinearity: 1.0
            });
        }
    };

    var addLayer = function(layerName) {
        var layer = getLayerByName(layerName);

        if (layer) {
            if (isAPOILayer(layerName)) {
                markerClusters.addLayer(layer);
            } else if (isALineLayer(layerName)) {
                map.addLayer(layer);

                if (generalConf.showArrows || (CONFIG.MAIN && CONFIG.MAIN.OPTIONS.showArrows)) {
                    if (layerName === 'filteredLine') {
                        for (var i in layer.arrows) {
                            polylineDecoratorLayers[layer.arrows[i].parentLabel][layer.arrows[i].featureId].addTo(map);
                        }
                    }
                    else {
                        for (var i in polylineDecoratorLayers[layerName]) {
                            polylineDecoratorLayers[layerName][i].addTo(map);
                        }
                    }
                }

                if (generalConf.useAlmostOver) {
                    map.almostOver.addLayer(layer);
                }
            } else if (utfGridOverlayLayersByLabel[layerName]) {
                map.addLayer(layer);
                map.addLayer(utfGridOverlayLayersByLabel[layerName]);
            }
        }
    };

    var removeLayer = function(layerName) {
        var layer = getLayerByName(layerName);

        if (layer) {
            if (isAPOILayer(layerName)) {
                markerClusters.removeLayer(layer);
            } else if (isALineLayer(layerName)) {
                map.removeLayer(layer);

                if (generalConf.showArrows || (CONFIG.MAIN && CONFIG.MAIN.OPTIONS.showArrows)) {
                    if (polylineDecoratorLayers[layerName]) {
                        for (var i in polylineDecoratorLayers[layerName]) {
                            map.removeLayer(polylineDecoratorLayers[layerName][i]);
                        }
                    }
                }

                if (generalConf.useAlmostOver) {
                    map.almostOver.removeLayer(layer);
                }
            } else if (utfGridOverlayLayersByLabel[layerName]) {
                map.removeLayer(layer);
                map.removeLayer(utfGridOverlayLayersByLabel[layerName])
            }
        }
    };

    var globalLineApplyStyle = function(feature) {
        if (typeof feature.properties === 'undefined') {
            return;
        }

        var overlayConf = feature.parent || {};

        return {
            color: feature.properties.color || overlayConf.color || styleConf.line.default.color,
            weight: feature.properties.weight || overlayConf.weight || styleConf.line.default.weight,
            opacity: feature.properties.opacity || overlayConf.opacity || styleConf.line.default.opacity
        };
    };

    var globalOnEachPOI = function(feature) {
        if (typeof feature.properties === 'undefined') {
            return;
        }

        var overlayConf = feature.parent || {};

        feature.properties.id = feature.properties.id || Utils.generateUID();
        feature.properties.icon = getFeatureIcon(feature, overlayConf);
        feature.properties.color = feature.properties.color || overlayConf.color;
        featureMapById[feature.properties.id] = feature;

        Model.addItemToLayer(feature, overlayConf);
    };

    var globalOnEachLine = function(feature) {
        if (typeof feature.properties === 'undefined') {
            return;
        }

        var overlayConf = feature.parent || {},
            currentRelatedPOIs;

        feature.properties.id = feature.properties.id || Utils.generateUID();
        feature.properties.icon = getFeatureIcon(feature, overlayConf);
        featureMapById[feature.properties.id] = feature;

        if (feature.properties.stages) {
            for (var i in feature.properties.stages) {
                for (var j in feature.properties.stages[i].pois) {
                    currentRelatedPOIs = feature.properties.stages[i].pois[j];
                    if (typeof itineraryRefByFeatureId[currentRelatedPOIs] === 'undefined') {
                        itineraryRefByFeatureId[currentRelatedPOIs] = [];
                    }
                    if (itineraryRefByFeatureId[currentRelatedPOIs].indexOf(feature.properties.id) === -1) {
                        itineraryRefByFeatureId[currentRelatedPOIs].push(feature.properties.id);
                    }
                }
            }
        }

        Model.addItemToLayer(feature, overlayConf);
    };

    var setItemInLocalStorage = function(key, data) {
        if (!useLocalCaching) {
            return;
        }

        // TODO: set in sub property

        //db.get(key).then(function(e) {
        //    db.remove(e);
        //});

        var insert = function() {
            db.put({
                _id: key,
                data: data
            }).then(function() {
                //localStorage.setItem(key, true);
                //console.log('Cached ' + key);
            });
        };

        db.get(key).then(function(e) {
            //console.log(e)
            db.remove(e)
                .then(function() {
                    insert();
                });
        }).catch(function() {
            insert();
        });

        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (err) {
            localStorage.clear();
            console.error('Local storage reset - ' + err);
        }
    };

    var getFeatureIcon = function(feature, overlayLayer) {
        return feature.properties.icon ||
            overlayLayer.icon ||
            'wm-icon-generic';
    };

    var getFeatureMarkerColor = function(feature, overlayLayer) {
        return feature.properties.color ||
            feature.properties.color ||
            overlayLayer.color ||
            'grey';
    };

    var genericPointToLayer = function(overlayLayer, feature, latlng) {
        var iconMarker = L.VectorMarkers.icon({
            icon: getFeatureIcon(feature, overlayLayer),
            prefix: 'wm',
            extraClasses: 'icon',
            markerColor: getFeatureMarkerColor(feature, overlayLayer),
            iconSize: [36, 45]
        });

        var marker = L.marker(latlng, {
            title: feature.properties.name,
            icon: iconMarker,
            riseOnHover: true
        });

        return marker;
    };

    var activateHighlight = function(layer, style) {
        if (layer.setStyle) {
            layer.setStyle(style);
        }
    };

    var clearLayerHighlight = function() {
        map.eachLayer(function(layer) {
            if (layer.feature &&
                layer.setStyle) {
                layer.actived = false;
                activateHighlight(layer, globalLineApplyStyle(layer.feature));
            }
        });
    };

    var resetLayers = function() {
        if (map === null) {
            return;
        }

        for (var i in overlayLayersByLabel) {
            removeLayer(i);
        }

        for (var j in extraLayersByLabel) {
            removeLayer(j);
        }
    };

    var activatePopup = function(e, isPOI) {
        var getIncrement = function(n) {
            var value = 19.6618;

            for (var i = 2; i <= n; i++) {
                value = value / 2;
            }
            return value;
        };

        if (e && e.layer &&
            e.layer.feature &&
            e.layer.feature.properties &&
            e.latlng) {
            var goToDetails = !e.layer.feature.properties.noDetails;
            var interaction = !e.layer.feature.properties.noInteraction;

            if (interaction) {
                var content = '<div class="popup-div" onclick="goToDetail(\'' + e.layer.feature.properties.id +'\', \'' + e.layer.feature.parent.label + '\', \'' + isPOI + '\', \'' + goToDetails + '\', \'' + e.latlng.lat + '\', \'' + e.latlng.lng + '\')">'
                // (!Utils.isBrowser() ? '<button class="popup-close" onclick="closePopup()">' +
                //     '<i class="icon wm-icon-android-close"></i></button>' : '') +
                ;

                if (e.layer.feature.properties.picture_url) {
                    content  = content +
                        '<div class="popup-img">' + 
                            '<img src="' + e.layer.feature.properties.picture_url + '" />' +
                        '</div>';
                }
                else if (e.layer.feature.properties.imageGallery) {
                    content  = content +
                    '<div class="popup-img">' + 
                        '<img src="' + e.layer.feature.properties.imageGallery[0].src + '" />' +
                    '</div>';
                }
                else {
                    content  = content +
                    '<div class="popup-img">' + 
                        '<div>' + 
                            '<i class="icon ' + e.layer.feature.properties.icon + '"></i>' +
                        '</div>' + 
                    '</div>';
                }
                var category = e.layer.feature.parent.label;

                if (e.layer.feature.parent.languages && e.layer.feature.parent.languages[currentLang]) {
                    category = e.layer.feature.parent.languages[currentLang];
                }

                content = content + 
                    '<div class="popup-content-img">' +
                        '<div class="popup-category">' +
                            category +
                        '</div>' +
                        '<div class="popup-content-title">' + 
                            '<div class="popup-title">' +
                                e.layer.feature.properties.name +
                            '</div>' +
                        '</div>' + 
                    '</div>' +
                    (goToDetails ? '<button class="popup-button"><i class="icon wm-icon-ios7-arrow-forward"></i></button>' : '') +
                    '</div>';

                L.popup({
                    autoPan: false
                })
                .setLatLng({
                    lat: e.latlng.lat + (isPOI && !mapIsRotating ? getIncrement(map.getZoom()) : 0),
                    lng: e.latlng.lng
                })
                .setContent(
                    content
                )
                .openOn(map);
            }
        } else if (e && e.data && e.latlng) {
            var content = '<div class="popup-div" onclick="goToTileUtfGridDetail(\'' + e.data.id + '\', \'' + e.parent.label + '\', \'' + e.latlng.lat + '\', \'' + e.latlng.lng + '\')">'
            // (!Utils.isBrowser() ? '<button class="popup-close" onclick="closePopup()">' +
            //     '<i class="icon wm-icon-android-close"></i></button>' : '') +
            ;

            // console.log(e);

            // Check for pictures linked
            // if (false) {
            //     content  = content +
            //         '<img class="popup-img" src="' + e.layer.feature.properties.picture_url + '" />';
            // }
            // else {
                content  = content +
                    '<div class="popup-img">' + 
                        '<div>' + 
                            '<i class="icon wm-icon-trail"></i>' +
                        '</div>' + 
                    '</div>';
            // }

            content = content +
                '<div class="popup-content-img">' + 
                    '<div class="popup-category">' +
                        e.parent.label +
                    '</div>' +
                    '<div class="popup-title">' +
                        e.data.name +
                    '</div>' +
                '</div>' +
                '<button class="popup-button"><i class="icon wm-icon-ios7-arrow-forward"></i></button>' +
                '</div>'


            L.popup()
                .setLatLng({
                    lat: e.latlng.lat,
                    lng: e.latlng.lng
                })
                .setContent(
                    content
                    // '<div class="popup-div-margin" onclick="goToTileUtfGridDetail(\'' + e.data.id + '\', \'' + e.parent.label + '\', \'' + e.latlng.lat + '\', \'' + e.latlng.lng + '\')">' +
                    // // '<button class="popup-close" onclick="closePopup()">' +
                    // // '<i class="icon wm-icon-android-close"></i></button>' +
                    // '<span class="popup-title">' +
                    // e.data.name +
                    // '</span>' +
                    // '<button class="popup-button"><i class="icon wm-icon-ios7-arrow-forward"></i></button>' +
                    // '</div>'
                )
                .openOn(map);
        }
    };

    var isPOILayerDetail = function() {
        var check = false;

        if ($state.current.name === 'app.main.detaillayer' && $state.params) {
            if ($state.params.parentId &&
                overlayLayersConfMap[$state.params.parentId.replace(/_/g, ' ')] &&
                overlayLayersConfMap[$state.params.parentId.replace(/_/g, ' ')].type === 'poi_geojson') {
                check = true;
            }
        }

        return check;
    };

    var isLineLayerDetail = function() {
        var check = false;

        if ($state.current.name === 'app.main.detaillayer' && $state.params) {
            if ($state.params.parentId &&
                overlayLayersConfMap[$state.params.parentId.replace(/_/g, ' ')] &&
                (overlayLayersConfMap[$state.params.parentId.replace(/_/g, ' ')].type === 'line_geojson' ||
                    overlayLayersConfMap[$state.params.parentId.replace(/_/g, ' ')].type === 'tile_utfgrid_geojson')) {
                check = true;
            }
        }

        return check;
    };

    var lineClick = function(e) {
        if (isLineLayerDetail()) {
            return;
        }

        var layer = e.layer;

        clearLayerHighlight();
        layer.actived = true;
        layerCliked = true;
        activateHighlight(layer, styleConf.line.highlight);
        activatePopup(e);

        // console.log('layer click', e);
    };

    var activateLineHandlers = function(linesLayer) {
        linesLayer.on('click', lineClick);

        linesLayer.on({
            mouseover: function(e) {
                if (isLineLayerDetail()) {
                    return;
                }

                var layer = e.layer;

                if (layer.actived) {
                    return;
                }
                activateHighlight(layer, styleConf.line.highlight);
                layer.bringToFront();
            },
            mouseout: function(e) {
                if (isLineLayerDetail()) {
                    return;
                }

                var layer = e.layer;

                if (layer.actived) {
                    return;
                }
                activateHighlight(layer, globalLineApplyStyle(layer.feature));
            }
        });
    };

    var activatePOIHandlers = function(pointsLayer) {
        pointsLayer.on('click', function(e) {
            // console.log('Clicked on a POI!', e);

            if (isPOILayerDetail()) {
                return;
            }

            activatePopup(e, true);
        });
    };

    var addFeaturesToFilteredLayer = function(groupedFeatures, fitToBounds, delayedFit) {
        resetLayers();

        var poiCollection = {
                type: 'FeatureCollection',
                features: []
            },
            linesCollection = {
                type: 'FeatureCollection',
                features: []
            },
            currentId, feature;

        var poiOptions = {
                pointToLayer: function(feature, latlng) {
                    return genericPointToLayer({}, feature, latlng);
                }
            },
            lineOptions = {
                style: globalLineApplyStyle
            },
            pointsLayer = L.geoJson(null, poiOptions),
            linesLayer = L.geoJson(null, lineOptions),
            groupLayer = L.featureGroup();

        pointsLayer.type = 'poi_geojson';
        linesLayer.type = 'line_geojson';

        for (var i in groupedFeatures) {
            for (var j in groupedFeatures[i]) {
                if (typeof groupedFeatures[i][j].properties !== 'undefined') {
                    currentId = groupedFeatures[i][j].properties.id;
                    if (typeof featureMapById[currentId] !== 'undefined') {
                        feature = featureMapById[currentId];

                        if (feature.geometry.type === 'Point') {
                            poiCollection.features.push(feature);
                        } else {
                            linesCollection.features.push(feature);
                        }

                    }
                }
            }
        }

        pointsLayer.addData(poiCollection);
        linesLayer.addData(linesCollection);

        if (generalConf.showArrows || (CONFIG.MAIN && CONFIG.MAIN.OPTIONS.showArrows)) {
            var featureIds = [];
            for (var pos in linesCollection.features) {
                featureIds = featureIds.concat([{
                    parentLabel: linesCollection.features[pos].parent.label,
                    featureId: linesCollection.features[pos].properties.id
                }]);
            }

            linesLayer.arrows = featureIds;
        }

        activatePOIHandlers(pointsLayer);
        activateLineHandlers(linesLayer);

        extraLayersByLabel['filteredPOI'] = pointsLayer;
        extraLayersByLabel['filteredLine'] = linesLayer;

        addLayer('filteredPOI');
        addLayer('filteredLine');

        if (fitToBounds) {
            pointsLayer.addTo(groupLayer);
            linesLayer.addTo(groupLayer);
            fitBounds(groupLayer.getBounds());
            if (delayedFit) {
                setTimeout(function() {
                    fitBounds(groupLayer.getBounds());
                }, delayedFit);
            }
        }

        return {
            poi: pointsLayer,
            line: linesLayer
        };
    };

    var initializeEvents = function() {
        var defer = $q.defer(),
            promise = defer.promise;

        if (CONFIG.EXTRA &&
            CONFIG.EXTRA.events) {

            var currentFromLocalStorage = localStorage.getItem(CONFIG.EXTRA.events.serverUrl);

            var eventCallback = function(data) {
                angular.extend(eventsList, data);

                for (var i in data) {
                    Model.addItemToContaier(data[i], 'events');
                    eventsMap[data[i].id] = data[i];
                }

                if (queueEvents) {
                    mapService.showEventsLayer();
                }

                defer.resolve();
            };

            if (useLocalCaching && currentFromLocalStorage) {
                eventCallback(JSON.parse(currentFromLocalStorage));

                $.getJSON(CONFIG.EXTRA.events.serverUrl, function(data) {
                    setItemInLocalStorage(CONFIG.EXTRA.events.serverUrl, data);
                    angular.extend(eventsList, data);
                });
            } else {
                $.getJSON(CONFIG.EXTRA.events.serverUrl, function(data) {
                    eventCallback(data);
                    setItemInLocalStorage(CONFIG.EXTRA.events.serverUrl, data);
                }).fail(function() {
                    defer.reject();
                });
            }
        }

        return promise;
    };

    var initializeOffers = function() {
        var defer = $q.defer(),
            promise = defer.promise;

        if (CONFIG.EXTRA &&
            CONFIG.EXTRA.coupons &&
            CONFIG.EXTRA.coupons.serverUrl) {
            $.getJSON(CONFIG.EXTRA.coupons.serverUrl, function(data) {
                angular.extend(couponsList, data);
                for (var i in data) {
                    data[i].body = data[i].body.replace(new RegExp(/href="([^\'\"]+)"/g), '');
                    couponsMap[data[i].id] = data[i];
                    Model.addItemToContaier(data[i], 'coupons');
                }

                defer.resolve(data);
            }).fail(function() {
                defer.reject();
            });
        } else {
            defer.reject();
        }


        return promise;
    };

    var initializeLanguages = function(){
        var languages = CONFIG.LANGUAGES;
        
    }

    var initializePages = function() {
        var pages = CONFIG.PAGES;

        var requestPages = function(item, index) {
            if (item.isCustom) {
                if (CONFIG.LANGUAGES && CONFIG.LANGUAGES.available) {
                    for (var pos in CONFIG.LANGUAGES.available) {
                        var url = CONFIG.OFFLINE.pagesUrl + item.type;
    
                        if (CONFIG.LANGUAGES.available[pos].substring(0, 2) !== CONFIG.LANGUAGES.actual.substring(0, 2)) {
                            url = url + "_" + CONFIG.LANGUAGES.available[pos].substring(0, 2);
                        }
    
                        url = url + '.html';
                        getPagesHtml(url);
                    }
                }
                else {
                    var url = CONFIG.OFFLINE.pagesUrl + item.type + ".html";
                    getPagesHtml(url);
                }
            };
        };

        var getPagesHtml = function(url) {
            $.get(url).done(function(data) {
                var insert = function() {
                    db.put({
                        _id: url,
                        data: data
                    }).then(function() {
                    }).catch(function() {
                        console.log(url + " page not updated");
                    });
                };

                db.get(url).then(function(e) {
                    db.remove(e)
                        .then(function() {
                            insert();
                        });
                }).catch(function() {
                    insert();
                });

            });
        };

        if (pages) {
            pages.forEach(requestPages);
        }


    };

    var initializeThen = function(currentOverlay) {
        var group = getParentGroup(currentOverlay.label);

        if (group) {
            overlayLayersByLabel[currentOverlay.label].addTo(group.layer);

            if (Object.keys(group.layer._layers).length === group.items.length) {
                group.isReady = true;
                if (queueLayerToActivate === group.label) {
                    mapService.activateLayer(queueLayerToActivate);
                    queueLayerToActivate = null;
                    $ionicLoading.hide();
                    return;
                }
            } else {
                if (queueLayerToActivate === group.label) {
                    mapService.activateLayer(currentOverlay.label, true, true, true);
                }
            }
        }

        if (queueLayerToActivate === currentOverlay.label) {
            mapService.activateLayer(queueLayerToActivate);
            queueLayerToActivate = null;
            $ionicLoading.hide();
        }
    };

    var initializeLayer = function(currentOverlay) {
        if (typeof overlayLayersQueueByLabel[currentOverlay.label] !== 'undefined') {
            return overlayLayersQueueByLabel[currentOverlay.label];
        }

        var languageUrl = "",
            available = false;

        if (CONFIG.LANGUAGES) {
            // if (CONFIG.LANGUAGES.available) {
            //     for (var i in CONFIG.LANGUAGES.available) {
            //         if (currentLang === CONFIG.LANGUAGES.available[i].substring(0, 2)) {
                        if (!CONFIG.LANGUAGES.actual ||
                            (CONFIG.LANGUAGES.actual && currentLang !== CONFIG.LANGUAGES.actual.substring(0, 2))) {
                            available = true;
                        }
            //             break;
            //         }
            //     }
            // }
        }
        var currentLangGeojsonUrl = "";

        if (available) {
            var split = currentOverlay.geojsonUrl.split("/");
            languageUrl = "/languages/" + currentLang + "/" + split.pop();

            currentLangGeojsonUrl = split.join("/") + languageUrl;
        }

        var currentFromLocalStorage = localStorage.getItem(offlineConf.resourceBaseUrl + currentOverlay.geojsonUrl);

        var defer = $q.defer(),
            promise = defer.promise;

        var poiCallback = function(data, currentOverlay) {
            var geoJsonOptions = {
                    pointToLayer: function(feature, latlng) {
                        return genericPointToLayer(currentOverlay, feature, latlng);
                    },
                    onEachFeature: function(feature) {
                        feature.parent = currentOverlay;
                        globalOnEachPOI(feature);
                    }
                },
                pointsLayer = L.geoJson(data, geoJsonOptions);

            geojsonByLabel[currentOverlay.label] = data;
            overlayLayersByLabel[currentOverlay.label] = pointsLayer;
            activatePOIHandlers(pointsLayer);
            defer.resolve(angular.extend({
                data: data
            }, currentOverlay));
        };

        var lineCallback = function(data, currentOverlay) {
            var geoJsonOptions = {
                    onEachFeature: function(feature, layer) {
                        if (!feature.parent) {
                            feature.parent = currentOverlay;
                        }
                        globalOnEachLine(feature, layer);

                        if (generalConf.showArrows || (CONFIG.MAIN && CONFIG.MAIN.OPTIONS.showArrows)) {
                            if (!polylineDecoratorLayers[currentOverlay.label]) {
                                polylineDecoratorLayers[currentOverlay.label] = {};
                            }
    
                            // polylineDecoratorLayers[currentOverlay.label][feature.properties.id] = L.polylineDecorator(layer, {
                            //     patterns: [{
                            //         offset: 20,
                            //         repeat: 100,
                            //         symbol: L.Symbol.marker({
                            //             markerOptions: {
                            //                 icon: arrowIcon
                            //             },
                            //             rotate: true
                            //         })
                            //     }]
                            // });
                            polylineDecoratorLayers[currentOverlay.label][feature.properties.id] = L.polylineDecorator(layer, {
                                patterns: [{
                                    offset: 20,
                                    repeat: 100,
                                    symbol: L.Symbol.arrowHead({
                                        polygon: true,
                                        pixelSize: 16,
                                        headAngle: 30,
                                        pathOptions: {
                                            color: '#fff',
                                            opacity: 0,
                                            fillColor: '#000',
                                            fillOpacity: 0.8,
                                            stroke: true,
                                            weight: 1
                                        }
                                    })
                                }]
                            });
    
                            polylineDecoratorLayers[currentOverlay.label][feature.properties.id].addTo(map);
                        }
                    },
                    style: function(feature) {
                        if (!feature.parent) {
                            feature.parent = currentOverlay;
                        }
                        return globalLineApplyStyle(feature);
                    }
                },
                linesLayer = L.geoJson(data, geoJsonOptions);

            overlayLayersByLabel[currentOverlay.label] = linesLayer;
            activateLineHandlers(linesLayer);
            defer.resolve(angular.extend({
                data: data
            }, currentOverlay));
        };

        var geojsonUrl = currentOverlay.geojsonUrl;
        var langGeojsonUrl = currentLangGeojsonUrl;
        if (offlineConf.resourceBaseUrl !== undefined) {
            geojsonUrl = offlineConf.resourceBaseUrl + geojsonUrl;
            langGeojsonUrl = offlineConf.resourceBaseUrl + currentLangGeojsonUrl;
        }

        if (useLocalCaching && currentFromLocalStorage) {
            if (currentOverlay.type === 'line_geojson') {
                db.get(geojsonUrl).then(function(e) {
                    lineCallback(e.data, currentOverlay);
                });
                //lineCallback(JSON.parse(currentFromLocalStorage), currentOverlay);
            } else if (currentOverlay.type === 'poi_geojson') {
                poiCallback(JSON.parse(currentFromLocalStorage), currentOverlay);
            }

            $.getJSON(geojsonUrl, function(data) {
                setItemInLocalStorage(geojsonUrl, data);
            });
        } else {
            overlayLayersQueueByLabel[currentOverlay.label] = $.getJSON(langGeojsonUrl, function(data) {
                if (currentOverlay.type === 'line_geojson') {
                    lineCallback(data, currentOverlay);
                } else if (currentOverlay.type === 'poi_geojson') {
                    poiCallback(data, currentOverlay);
                }
                setItemInLocalStorage(geojsonUrl, data);
                delete overlayLayersQueueByLabel[currentOverlay.label];
            }).fail(function() {
                overlayLayersQueueByLabel[currentOverlay.label] = $.getJSON(geojsonUrl, function(data) {
                    if (currentOverlay.type === 'line_geojson') {
                        lineCallback(data, currentOverlay);
                    } else if (currentOverlay.type === 'poi_geojson') {
                        poiCallback(data, currentOverlay);
                    }
                    setItemInLocalStorage(geojsonUrl, data);
                    delete overlayLayersQueueByLabel[currentOverlay.label];
                }).fail(function() {
                    defer.reject();
                });
            });
        }

        promise.then(function() {
            var url = geojsonUrl.split('/'),
                lang = url[url.length - 2];
            if (lang === currentLang || (CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual && CONFIG.LANGUAGES.actual.substring(0, 2) === currentLang && lang.length !== 2)) {
                initializeThen(currentOverlay);
            }
        });

        return promise;
    };

    var initializeUtfGridGeojson = function(currentOverlay) {
        if (typeof overlayLayersQueueByLabel[currentOverlay.label] !== 'undefined') {
            return overlayLayersQueueByLabel[currentOverlay.label];
        }

        var defer = $q.defer(),
            promise = defer.promise;

        var mapReference = document.getElementById('map');

        var options = {
            minZoom: mapConf.minZoom,
            maxZoom: mapConf.maxZoom,
            bounds: getMaxBounds()
        };

        if (!currentOverlay.geojsonUrl ||
            !currentOverlay.tilesUrl ||
            !currentOverlay.gridUrl) {
            console.error('Specify geojsonUrl,  tilesUrl and gridUrl in config');
            defer.reject();
            return promise;
        }

        var tileLayer = tileLayersByLabel[currentOverlay.label] = L.tileLayer(currentOverlay.tilesUrl + '{z}/{x}/{y}.png', options);

        utfGridOverlayLayersByLabel[currentOverlay.label] = L.utfGridCanvas(currentOverlay.tilesUrl + '{z}/{x}/{y}.grid.json', {
            idField: 'ref', // Expects UTFgrid to have a property 'ID' that indicates the feature ID
            buildIndex: true, // requires above field to be set properly
            // fillColor: 'green',
            // shadowBlur: 10,  // Number of pixels for blur effect
            // shadowColor: 'green',  // Color for shadow, if present.  Defaults to fillColor.
            // pointerCursor: true,
            debug: true // if true, show tile borders and tile keys
        });

        // TODO: temporary, to fix with leaflet update
        utfGridOverlayLayersByLabel[currentOverlay.label].on('mouseover', function() {
            if (mapReference) {
                mapReference.style.cursor = 'pointer';
            }
        });
        utfGridOverlayLayersByLabel[currentOverlay.label].on('mouseout', function() {
            if (mapReference) {
                mapReference.style.cursor = 'default';
            }
        });

        utfGridOverlayLayersByLabel[currentOverlay.label].on('click', $.proxy(function(e) {
            if (skipAreaClick || !e.data) {
                skipAreaClick = null;
                return;
            }


            areaMapById[e.data.id] = angular.extend({}, {
                properties: e.data
            }, {
                parent: {
                    label: this.baseMapLabel,
                    mapping: this.baseMapMapping
                }
            });
            activatePopup(angular.extend(e, {
                parent: {
                    label: this.baseMapLabel,
                    mapping: this.baseMapMapping
                }
            }));
        }, {
            baseMapLabel: currentOverlay.label,
            baseMapMapping: currentOverlay.mapping
        }));

        var currentFromLocalStorage = localStorage.getItem(offlineConf.resourceBaseUrl + currentOverlay.geojsonUrl);

        var utfgridCallback = function(data, currentOverlay, layerGroup) {
            overlayLayersByLabel[currentOverlay.label] = layerGroup;
            for (var i = 0; i < data.features.length; i++) {
                data.features[i].parent = currentOverlay;
                Model.addItemToLayer(data.features[i], currentOverlay);
            }

            defer.resolve(angular.extend({
                data: data
            }, currentOverlay));
        };

        // layerControl.addOverlay(layerGroup);
        // tileLayer.addTo(map);

        // utfGrid.on('click', function(e) {
        //     console.log('sentieriSatGrid click', e.data);
        // });

        if (useLocalCaching && currentFromLocalStorage) {
            utfgridCallback(JSON.parse(currentFromLocalStorage), currentOverlay, tileLayer);

            $.getJSON(offlineConf.resourceBaseUrl + currentOverlay.geojsonUrl, function(data) {
                setItemInLocalStorage(offlineConf.resourceBaseUrl + currentOverlay.geojsonUrl, data);
            });
        } else {
            overlayLayersQueueByLabel[currentOverlay.label] = $.getJSON(offlineConf.resourceBaseUrl + currentOverlay.geojsonUrl, function(data) {
                utfgridCallback(data, currentOverlay, tileLayer);
                setItemInLocalStorage(offlineConf.resourceBaseUrl + currentOverlay.geojsonUrl, data);
                delete overlayLayersQueueByLabel[currentOverlay.label];
            }).fail(function() {
                defer.reject();
            });
        }

        promise.then(function() {
            initializeThen(currentOverlay);
        });

        return promise;
    };

    var initializeLayers = function() {
        var promises = [];

        // console.log(overlayLayersConf);
        for (var i = overlayLayersConf.length - 1; i >= 0; i--) {
            if (!overlayLayersConf[i]) {
                continue;
            }
            
            if (overlayLayersConf[i].type === 'utfgrid') {
                var utfGridmap = new L.UtfGrid(overlayLayersConf[i].url, {
                        useJsonP: false,
                        resolution: 4,
                        maxZoom: 16
                    }),
                    layerGroup = L.layerGroup([utfGridmap]);

                // layerGroup.addTo(map);
                // TODO: test it
                layerControl.addOverlay(layerGroup);

                utfGridmap.on('click', function(e) {
                    console.log('utfgrid click', e.data);
                });
            } else {
                if (overlayLayersConf[i].type === 'poi_geojson' ||
                    overlayLayersConf[i].type === 'line_geojson') {
                    promises.push(initializeLayer(overlayLayersConf[i]));
                } else if (overlayLayersConf[i].type === 'tile_utfgrid_geojson') {
                    // alert('support work in progress')
                    promises.push(initializeUtfGridGeojson(overlayLayersConf[i]));
                }
            }
        }

        eventsPromise = initializeEvents();
        couponsPromise = initializeOffers();

        $q.all(promises).then(function() {
            $ionicLoading.hide();

            if (queueLayerToActivate !== null) {
                if (queueLayerToActivate === '$all') {
                    mapService.showAllLayers();
                } else {
                    mapService.activateLayer(queueLayerToActivate);
                }

                queueLayerToActivate = null;
            }

            dataReady = true;
            $rootScope.$$phase || $rootScope.$digest();
        });
    };

    var getMaxBounds = function() {
        var southWest = L.latLng(mapConf.bounds.southWest),
            northEast = L.latLng(mapConf.bounds.northEast);

        return L.latLngBounds(southWest, northEast);
    };

    var readLocalMbTiles = function(fileEntry, options) {
        return $q(function(resolve, reject) {
            if (fileEntry !== void 0 && fileEntry.isFile) {
                fileEntry.file(
                    function(blob) {
                        var fr = new FileReader();

                        fr.onload = function(evt) {
                            resolve(L.tileLayer.mbTiles(evt.target.result, options));
                        };

                        var idx = 0;

                        fr.onerror = function(e) {
                            reject();
                        };

                        fr.readAsArrayBuffer(blob);
                    },
                    function(e) {
                        reject();
                    }
                );
            }
        });
    };

    var resetOfflineData = function(e) {
      // @TODO local mbtiles file was not found. reset offline settings
      console.error('@TODO local mbtiles file was not found. reset offline settings');
    };

    var setBaseLayer = function(baseMap, baseTms, baseLayer) {
      if (baseMap.default) {
          Offline.setDefaultInfo(baseLayer, baseMap.tilesUrl + '{z}/{x}/{y}.png', baseTms, mapService.resetView);
          localStorage.currentMapLayer = localStorage.currentMapLayer || baseMap.label;

          if (!baseLayersByLabel[localStorage.currentMapLayer]) {
              localStorage.currentMapLayer = baseMap.label;
          }
          // baseLayer.addTo(map);
      }

      baseLayersByLabel[baseMap.label] = baseLayer;
    }

    var buildBaseLayer = function(maxBounds, i) {
      return $q(function(resolve, reject) {
        var baseMap = mapConf.layers[i],
            options = {},
            baseLayer = null,
            baseTms = false,
            address = '';

          if (baseMap.type === 'maptile') {
              options = {
                  minZoom: mapConf.minZoom,
                  maxZoom: mapConf.maxZoom,
                  // reuseTiles: true,
                  bounds: maxBounds
              };

              if (typeof baseMap.tms !== undefined && baseMap.tms) {
                  baseTms = options.tms = true;
              }

              if (Offline.isActive()) {
                  address = Offline.getOfflineUrl();
                  resolveLocalFileSystemURL(
                      address,
                      function(ap) {
                          var bl = L.tileLayer.mbTiles(address, options);
                          setBaseLayer(baseMap, baseTms, bl);
                          resolve();
                      },
                      resetOfflineData);
              } else {
                  address = baseMap.tilesUrl + '{z}/{x}/{y}.png';
                  setBaseLayer(baseMap, baseTms, L.tileLayer(address, options));
                  resolve();
              }

              setBaseLayer(baseMap, baseTms, L.tileLayer(address, options));

        } else if (baseMap.type === 'wms') {
            baseLayer = L.tileLayer.wms(baseMap.tilesUrl + '{z}/{x}/{y}.png', {
                layers: baseMap.layers,
                format: baseMap.format,
                attribution: baseMap.attribution
            });
            setBaseLayer(baseMap, baseTms, baseLayer);
            resolve();
        } else if (baseMap.type === 'utfgrid') {
            utfGridBaseLayerByLabel[baseMap.label] = L.utfGridCanvas(baseMap.tilesUrl + '{z}/{x}/{y}.grid.json', {
                idField: 'id', // Expects UTFgrid to have a property 'ID' that indicates the feature ID
                buildIndex: true, // requires above field to be set properly
                // fillColor: 'black',
                // shadowBlur: 0,  // Number of pixels for blur effect
                // shadowColor: null,  // Color for shadow, if present.  Defaults to fillColor.
                debug: false // if true, show tile borders and tile keys
            });

            setTimeout(function() {
                utfGridBaseLayerByLabel[baseMap.label].addTo(map);
            }, 500);

            utfGridBaseLayerByLabel[baseMap.label].on('click', $.proxy(function(e) {
                if (skipAreaClick) {
                    skipAreaClick = null;
                    return;
                }

                areaMapById[e.data.id] = angular.extend({}, {
                    properties: e.data
                }, {
                    parent: {
                        label: this.baseMapLabel,
                        mapping: this.baseMapMapping
                    }
                });
                activatePopup(angular.extend(e, {
                    parent: {
                        label: this.baseMapLabel,
                        mapping: this.baseMapMapping
                    }
                }));
            }, {
                baseMapLabel: baseMap.label,
                baseMapMapping: baseMap.mapping
            }));
            setBaseLayer(baseMap, baseTms, L.tileLayer(address, options));
            resolve();
        } else if (baseMap.type === 'mbtiles') {
            options = {
                minZoom: mapConf.minZoom,
                maxZoom: mapConf.maxZoom,
                // reuseTiles: true,
                bounds: maxBounds
            };

            if (Offline.isActive()) {
                address = Offline.getOfflineUrl();
                setBaseLayer(baseMap, false, L.tileLayer.mbTiles(address, options));
                resolve();
            } else {
                address = baseMap.tilesUrl;
                resolveLocalFileSystemURL(
                  address,
                  function(ap) {
                    var bl = L.tileLayer.mbTiles(address, options);
                    setBaseLayer(baseMap, baseTms, bl);
                    resolve();
                  },
                  resetOfflineData);
            }
        }
      });
    }

    var initialize = function() {

        //
        initializeLanguages();

        if( typeof localStorage.$wm_mhildConf === 'undefined' ){
            pagePromise = initializePages();
        }

        if (map && map !== null) {
            return map;
        }

        if (mapConf.layers.length === 0) {
            return;
        }

        var maxBounds = null,
            mapCenter = null,
            defZoom = mapConf.defZoom,
            minZoom = mapConf.minZoom,
            maxZoom = mapConf.maxZoom;

        if (mapConf.bounds) {
            var southWest = L.latLng(mapConf.bounds.southWest),
                northEast = L.latLng(mapConf.bounds.northEast);

            maxBounds = L.latLngBounds(southWest, northEast);
            // mapCenter = maxBounds.getCenter();
        }

        mapCenter = L.latLng(mapConf.center.lat, mapConf.center.lng);

        baseView = {
            mapCenter: mapCenter,
            defZoom: defZoom,
            minZoom: minZoom,
            maxZoom: maxZoom
        };

        map = L.map('map', {
            minZoom: minZoom,
            maxZoom: maxZoom,
            zoom: defZoom,
            center: mapCenter,
            maxBounds: maxBounds,
            zoomControl: false,
            rotate: true
        });

        if (CONFIG.OPTIONS.activateZoomControl || (CONFIG.MAIN && CONFIG.MAIN.OPTIONS.activateZoomControl)) {
            L.control.zoom({
                position: 'topright'
            }).addTo(map);
        }

        map.on('click', function() {
            if (layerCliked) {
                layerCliked = null;
                return;
            }

            clearLayerHighlight();
        });

        map.on('dragstart', function() {
            $rootScope.$emit('map-dragstart');
        });

        if (generalConf.useAlmostOver) {
            map.on('almost:click', function(e) {
                lineClick(e);
                skipAreaClick = true;
            });
        }

        map.on('move', function() {
            var center = map.getCenter();
            var etrs89projection = "+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs ";
            var etrs89coords;

            centerCoords.lat = center.lat.toFixed(4);
            centerCoords.lng = center.lng.toFixed(4);

            etrs89coords = proj4(etrs89projection, [Number(centerCoords.lng), Number(centerCoords.lat)]); 
            centerCoordsUTM32.lng = Math.round(etrs89coords[0]); 
            centerCoordsUTM32.lat = Math.round(etrs89coords[1]);

            Utils.forceDigest();
        });

        map.on('zoomstart', function() {
            mapService.closePopup();
        });

        map.on('locationfound', function(location){
            $rootScope.$emit('map-location-found', location);
            mapService.centerOnScreen(location);
        })

        if (mapConf.showScaleInMap) {
            L.control.scale({
                position: 'topleft',
                imperial: false
            }).addTo(map);
        }

        if (Utils.isBrowser()) {
            new L.Hash(map);
        }

        if (!mapConf.hideLocationControl) {
            controlLocate = L.control.locate({
                remainActive: false,
                position: 'topleft',
                setView: false,
                drawCircle: false,
                circleStyle: {
                    opacity: 0,
                    fillOpacity: 0
                },
                markerStyle: {
                    opacity: 0,
                    fillOpacity: 0
                },
                locateOptions: {
                    enableHighAccuracy: true,
                    watch: false,
                    setView: false
                },
                onLocationOutsideMapBounds: function() {
                    // TODO: add language and message in settings
                    $ionicPopup.alert({
                        template: $translate.instant("Sembra che tu sia fuori dai limiti della mappa!"),
                        title: $translate.instant("ATTENZIONE")
                    });
                }
            }).addTo(map);
        }

        markerClusters = new L.MarkerClusterGroup({
            spiderfyOnMaxZoom: mapConf.markerClustersOptions.spiderfyOnMaxZoom,
            showCoverageOnHover: mapConf.markerClustersOptions.showCoverageOnHover,
            zoomToBoundsOnClick: false, // used markerClusters.on clusterclick instead
            maxClusterRadius: mapConf.markerClustersOptions.maxClusterRadius,
            disableClusteringAtZoom: mapConf.markerClustersOptions.disableClusteringAtZoom
        });

        markerClusters.addTo(map);

        markerClusters.on('clusterclick', function(a) {
            if (map.getZoom() < mapConf.maxZoom) {
                map.fitBounds(a.layer.getBounds());
                map.removeLayer(markerClusters);

                setTimeout(function() {
                    markerClusters.addTo(map);
                }, 500);
            } else {
                map.setView({
                    lat: a.latlng.lat,
                    lng: a.latlng.lng
                });
            }
        });

        var baseLayersPromises = [];
        for (var i = 0; i < mapConf.layers.length; i++) {
            baseLayersPromises.push(buildBaseLayer(maxBounds, i));
        }

        $q.all(baseLayersPromises)
          .then(function() {
            baseLayersByLabel[localStorage.currentMapLayer].addTo(map);
          })
          .catch(function(e) {
            console.error(e);
          });

        layerControl = L.control.groupedLayers();
        layerControl.addTo(map);

        initializeLayers();

        return map;
    };

    var makeNotificationSound = function() {
        var audio = new Audio('core/audio/alertNotificationSound.mp3');
        audio.play();
    };

    mapService.getPageInPouchDB = function(key){
        return db.get(key);
    };

    mapService.resetLoading = function() {
        $timeout.cancel(updateHitsTimer);
    };

    mapService.overlayLayersConfMap = function() {
        return overlayLayersConfMap;
    };

    mapService.getCurrentMapLayerName = function() {
        return localStorage.currentMapLayer;
    };

    mapService.activateMapLayer = function(layerName) {
        if (map === null) {
            return;
        }

        if (typeof baseLayersByLabel[layerName] !== 'undefined') {
            mapService.resetMapLayers();
            localStorage.currentMapLayer = layerName;
            map.addLayer(baseLayersByLabel[layerName]);

            for (var i in tileLayersByLabel) {
                if (activeFilters[i]) {
                    mapService.removeLayer(i);
                    setTimeout(function() {
                        mapService.activateLayer(i, true, true);
                    }, 100);
                }
            }
        }
    };

    mapService.activateLayer = function(layerName, skipReset, skipFit, skipQueueReset) {
        var group = {},
            isGroup = group = Model.isAnOverlayGroup(layerName),
            groupLayer = L.featureGroup(),
            currentLayer;

        var layersCache = [];

        var addLayersGroup = function() {
            $timeout.cancel(updateHitsTimer);

            if (layersCache.length === 0) {
                fitBounds(groupLayer.getBounds());
                return;
            }

            var currentHits = 0,
                maxHits = 1,
                delay = 60;

            var doAdd = function() {
                var subLayerName = '';
                while (currentHits < maxHits && layersCache.length !== 0) {
                    subLayerName = layersCache.shift();
                    addLayer(subLayerName);

                    if (!skipFit) {
                        currentLayer = getLayerByName(subLayerName);
                        if (currentLayer) {
                            currentLayer.addTo(groupLayer);
                        }
                    }

                    currentHits++;
                }

                addLayersGroup();
            };

            updateHitsTimer = $timeout(function() {
                doAdd();
            }, delay);
        };

        if (!skipQueueReset) {
            queueLayerToActivate = null;
        }

        if (getLayerByName(layerName) ||
            (groupConfMap[layerName] &&
                groupConfMap[layerName].isReady)) {
            if (!skipReset) {
                mapService.resetLayers();
            }

            if (!isGroup) {
                addLayer(layerName);
                if (!skipFit) {
                    currentLayer = getLayerByName(layerName);
                    currentLayer && fitBounds(currentLayer.getBounds());
                }
            } else {
                layersCache = angular.extend([], group.items);
                addLayersGroup();
            }
        } else {
            queueLayerToActivate = layerName;
        }
    };

    mapService.removeLayer = function(layerName) {
        if (map === null) {
            return;
        }

        removeLayer(layerName);
    };

    mapService.setFilter = function(layerName, value) {
        activeFilters[layerName] = value;
        localStorage.setItem('activeFilters', JSON.stringify(activeFilters));

        if (activeFilters[layerName]) {
            mapService.activateLayer(layerName, true, true);
        } else {
            mapService.removeLayer(layerName);
        }
    };

    mapService.activateAllFilters = function() {
        for (var layerName in activeFilters) {
            mapService.activateLayer(layerName);
        }
    };

    mapService.getActiveFilters = function() {
        return activeFilters;
    };

    mapService.showEventsLayer = function() {
        var events = Model.getItemsByContaier('events'),
            pois = [];

        if (map !== null && events) {
            mapService.resetLayers();
            for (var i in events) {
                for (var j in events[i].pois) {
                    if (typeof featureMapById[events[i].pois[j]] !== 'undefined') {
                        pois.push(featureMapById[events[i].pois[j]]);
                    }
                }
            }
            addFeaturesToFilteredLayer({
                events: pois
            }, true);
        } else {
            queueEvents = true;
        }
    };

    mapService.showAllLayers = function() {
        if (map === null) {
            queueLayerToActivate = '$all';
            return;
        }

        mapService.resetLayers();

        for (var i in overlayLayersByLabel) {
            if (activeFilters[i]) {
                addLayer(i);
            }
        }
    };

    mapService.activateUtfGrid = function() {
        for (var i in utfGridBaseLayerByLabel) {
            map.addLayer(utfGridBaseLayerByLabel[i]);
        }
    };

    mapService.resetUtfGridLayers = function() {
        for (var i in utfGridBaseLayerByLabel) {
            map.removeLayer(utfGridBaseLayerByLabel[i]);
        }
    };

    mapService.resetUtfGridOverlayLayers = function() {
        for (var i in utfGridOverlayLayersByLabel) {
            map.removeLayer(utfGridOverlayLayersByLabel[i]);
        }
    };

    mapService.resetMapLayers = function() {
        if (map === null) {
            return;
        }

        for (var i in baseLayersByLabel) {
            map.removeLayer(baseLayersByLabel[i]);
        }
    };

    mapService.resetLayers = function() {
        // mapService.resetUtfGridLayers();
        resetLayers();
    };

    mapService.resetView = function() {
        var lat = baseView.mapCenter.lat,
            lng = baseView.mapCenter.lng,
            zoom = baseView.defZoom;

        map.setView({
            lat: lat,
            lng: lng
        }, mapConf.defZoom);

        // TODO: temporary fix for tms switching
        setTimeout(function() {
            map.setView({
                lat: lat,
                lng: lng
            }, zoom);
        }, 10);
    };

    mapService.centerOnFeature = function(feature) {
        var latlngs = [],
            coord;

        if (feature.geometry.type == 'LineString' || feature.geometry.type == 'MultiLineString') {
            for (var i in feature.geometry.coordinates) {
                if (feature.geometry.type == 'MultiLineString') {
                    for (var j in feature.geometry.coordinates[i]) {
                        coord = feature.geometry.coordinates[i][j];
                        latlngs.push(L.GeoJSON.coordsToLatLng(coord));
                    }
                } else {
                    coord = feature.geometry.coordinates[i];
                    latlngs.push(L.GeoJSON.coordsToLatLng(coord));
                }
            }

            fitBounds(latlngs);
        } else {
            map.setView({
                lat: feature.geometry.coordinates[1],
                lng: feature.geometry.coordinates[0]
            }, mapConf.maxZoom);
        }
    };

    mapService.centerOnCoords = function(lat, lng) {
        map.setView({
            lat: lat,
            lng: lng
        },
        CONFIG.MAP.maxZoom);
    };

    mapService.drawAccuracy = function(accuracy) {
        circleLocation.accuracy.setRadius(accuracy);
    };

    mapService.drawPosition = function(position) {
        if (circleLocation.position === null && circleLocation.accuracy === null) {
            circleLocation.position = L.marker([position.coords.latitude, position.coords.longitude], {icon: locationIcon}).addTo(map);

            circleLocation.accuracy = L.circle([position.coords.latitude, position.coords.longitude], {
                weight: 1,
                color: '#3E82F7',
                fillColor: '#3E82F7',
                fillOpacity: 0.2,
                radius: position.coords.accuracy
            }).addTo(map);
        }
        else {
            var newLatLng = new L.LatLng(position.coords.latitude, position.coords.longitude);
            circleLocation.position.setLatLng(newLatLng);
            circleLocation.accuracy.setLatLng(newLatLng);
            circleLocation.accuracy.setRadius(position.coords.accuracy);
        }
    };

    mapService.isInBoundingBox = function(lat, long) {
        var bounds = new L.latLngBounds(
            new L.latLng(mapConf.bounds.southWest),
            new L.latLng(mapConf.bounds.northEast));

        return bounds.contains(
            new L.latLng(lat, long));
    };

    mapService.precacheOverlaysData = function() {
        for (var overlay in overlayLayersConf) {
            $.getJSON(overlayLayersConf[overlay].url, $.proxy(function(data) {
                setItemInLocalStorage(overlayLayersConf[this.overlay].url, data);
            }, {
                overlay: overlay
            }));
        }
    };

    mapService.adjust = function() {
        if (map) {
            clearLayerHighlight();
            map.invalidateSize();
        }
    };

    mapService.initialize = function() {
        if (Utils.isBrowser()) {
            initialize();
        } else {
            document.addEventListener('deviceready', function() {
                initialize();
            });
        }
    };

    mapService.resetMap = function() {
        if (map !== null) {
            map.remove();
            map = null;
        }
    };

    mapService.addFeaturesToFilteredLayer = function(groupedFeatures, fitToBounds, delayedFit) {
        addFeaturesToFilteredLayer(groupedFeatures, fitToBounds, delayedFit);
    };

    mapService.isReady = function() {
        return dataReady;
    };

    mapService.getBaseLayers = function() {
        return baseLayersByLabel;
    };

    mapService.getOverlayLayers = function() {
        return overlayLayersByLabel;
    };

    mapService.getEventsList = function() {
        return eventsList;
    };

    mapService.getFeatureIdMap = function() {
        return featureMapById;
    };

    mapService.getFeatureById = function(id, layerName) {
        var defer = $q.defer();

        var checkNow = function() {
            if (featureMapById[id]) {
                defer.resolve(featureMapById[id]);
            } else {
                defer.reject();
            }
        };

        if (overlayLayersConfMap[layerName].type === 'tile_utfgrid_geojson' &&
                overlayLayersConfMap[layerName].featureUrl) {
            $.getJSON(overlayLayersConfMap[layerName].featureUrl + id + '.geojson', function(data) {
                var feature = data.features[0];
                if (feature &&
                    feature.properties) {
                    feature.parent = overlayLayersConfMap[layerName];
                    featureMapById[feature.properties.id] = feature;
                    defer.resolve(feature);
                } else {
                    defer.reject();
                }
            }).fail(function() {
                defer.reject();
            });
        } else {
            if (typeof overlayLayersConfMap[layerName] === 'undefined') {
                if (typeof featureMapById[id] !== 'undefined') {
                    defer.resolve(featureMapById[id]);
                } else if (singleFeatureUrl) {
                    $.getJSON(singleFeatureUrl + id, function(data) {
                        var feature = data.features;
                        if (feature &&
                            feature.properties) {
                            // feature.parent = overlayLayersConfMap[feature.properties.category];
                            feature.parent = overlayLayersConfMap[layerName];
                            featureMapById[feature.properties.id] = feature;
                            defer.resolve(feature);
                        } else {
                            defer.reject();
                        }
                    }).fail(function() {
                        defer.reject();
                    });
                } else {
                    defer.reject();
                }
            }

            if (overlayLayersByLabel[layerName]) {
                checkNow();
            } else {
                if (overlayLayersQueueByLabel[layerName]) {
                    overlayLayersQueueByLabel[layerName].then(checkNow);
                } else if (overlayLayersConfMap[layerName]) {
                    initializeLayer(overlayLayersConfMap[layerName]).then(checkNow);
                }
            }
        }


        return defer.promise;
    };

    mapService.getRelatedFeaturesById = function(relatedId) {
        var features = [];
        for (var pos in relatedId) {
            features[pos] = featureMapById[relatedId[pos]];
        }

        return features;
    };

    mapService.getAreaById = function(id) {
        var defer = $q.defer();

        if (typeof areaMapById[id] !== 'undefined') {
            defer.resolve(areaMapById[id]);
        } else {
            defer.reject();
        }

        return defer.promise;
    };

    mapService.getEventById = function(id) {
        var defer = $q.defer();

        var checkNow = function() {
            if (eventsMap[id]) {
                defer.resolve(eventsMap[id]);
            } else {
                defer.reject();
            }
        };

        if (eventsMap[id]) {
            checkNow();
        } else {
            setTimeout(function() {
                eventsPromise.then(function() {
                    checkNow();
                });
            }, 100);
        }

        return defer.promise;
    };

    mapService.getCouponById = function(id) {
        var defer = $q.defer();

        var checkNow = function() {
            if (couponsMap[id]) {
                defer.resolve(couponsMap[id]);
            } else {
                defer.reject();
            }
        };

        if (couponsMap[id]) {
            checkNow();
        } else {
            setTimeout(function() {
                couponsPromise.then(function() {
                    checkNow();
                });
            }, 100);
        }

        return defer.promise;
    };

    mapService.getItineraryRefByFeatureIdMap = function() {
        return itineraryRefByFeatureId;
    };

    mapService.getCenterCoordsReference = function() {
        if (!(centerCoords.lat || centerCoords.lng)) {
            centerCoords = {
                lat: CONFIG.MAP.center.lat.toFixed(4),
                lng: CONFIG.MAP.center.lng.toFixed(4)
            };
        }

        return centerCoords;
    };

    mapService.getCenterCoordsUTM32Reference = function() {
        return centerCoordsUTM32;
    };

    mapService.fitBounds = function(bounds) {
        fitBounds(bounds);
    };
    
    mapService.fitBoundsFromString = function(stringBounds) {
        var bsplit = stringBounds.split(','),
            swsplit = bsplit[0].split(' '),
            nesplit = bsplit[1].split(' '),
            southWest = L.latLng([swsplit[1], swsplit[0]]),
            northEast = L.latLng([nesplit[1], nesplit[0]]);

        fitBounds(L.latLngBounds(southWest, northEast));
    };

    mapService.getCouponsList = function() {
        return couponsList;
    };

    mapService.getBounds = function() {
        if (map) {
            return map.getBounds();
        }
    };

    mapService.isAPOILayer = function(layerName) {
        return isAPOILayer(layerName);
    };

    mapService.setBearing = function(n) {
        map && map.setBearing(n);
    };

    mapService.setZoom = function(n) {
        map && map.setZoom(n);
    };

    mapService.getZoom = function() {
        return map.getZoom();
    };

    mapService.disableDrag = function() {
        map && map.dragging.disable();
    };

    mapService.enableDrag = function() {
        map && map.dragging.enable();
    };

    mapService.startControlLocate = function(){
        if ( controlLocate !== null ){
            controlLocate.start();
        }
    };

    mapService.stopControlLocate = function(){
        if ( controlLocate !== null ){
            controlLocate.stop();
        }
    };

    mapService.centerOnScreen = function(location) {
        map.panTo(new L.LatLng(location.latlng.lat, location.latlng.lng));
    };

    mapService.createPositionMarkerAt = function(lat, long) {
        var getIncrement = function(n) {
            var value = 19.6618;

            for (var i = 2; i <= n; i++) {
                value = value / 2;
            }
            return value;
        };

        var radius = 35,
            styleCircle = {
                color: '#136AEC',
                fillColor: '#136AEC',
                fillOpacity: 0.15,
                weight: 2,
                opacity: 0.5
            },
            styleMarker =  {
                color: '#136AEC',
                fillColor: '#2A93EE',
                fillOpacity: 0.7,
                weight: 2,
                opacity: 0.9,
                radius: 5
            };

        positionCircle = L.circle({lat: lat, lng: long}, radius, styleCircle).addTo(map);
        positionMarker = new L.CircleMarker({lat: lat, lng: long}, styleMarker).addTo(map);

        positionMarker.on('click', function(e) {
            L.popup()
                .setLatLng({
                    lat: e.latlng.lat,
                    lng: e.latlng.lng
                })
                .setContent($translate.instant("La tua posizione"))
                .openOn(map);
        });
    };

    mapService.removePositionMarker = function() {
        if (positionMarker) {
            map.removeLayer(positionMarker);
            map.removeLayer(positionCircle);
            positionMarker = null;
            positionCircle = null;
        }
    };

    mapService.triggerNearestPopup = function(latLong) {
        var layerToSelectNearest = leafletKnn(extraLayersByLabel['filteredPOI']);
        var nearPois = layerToSelectNearest.nearest([latLong.long, latLong.lat], 10, 100);
        if (nearPois[0] && nearPois[0].layer && nearPois[0].layer.feature) {
            for (var pos in nearPois) {
                if (nearPois[pos].layer.feature.parent.alert) {
                    if (!activatedPopup || activatedPopup !== nearPois[pos].layer.feature.properties.id) {
                        nearPois[pos].latlng = {
                            lat: nearPois[pos].lat,
                            lng: nearPois[pos].lon
                        }
            
                        activatedPopup = nearPois[pos].layer.feature.properties.id;
                        activatePopup(nearPois[pos], false);

                        makeNotificationSound();
                    }
                    break;
                }
            }
        }
        else {
            map.closePopup();
            activatedPopup = null;
        }
    };

    mapService.mapIsRotating = function(isRotating) {
        map.closePopup();
        mapIsRotating = isRotating;
    };

    window.closePopup = mapService.closePopup = function(e) {
        map && map.closePopup();
        try {
            event && event.stopPropagation();
        } catch (err) {}
    };

    window.goToDetail = function(id, parentLabel, isPOI, goToDetails, lat, lng) {
        if (goToDetails === 'false') {
            return;
        }

        if (isPOI === 'true') {
            map.setView({
                lat: lat,
                lng: lng
            }, mapConf.maxZoom);
        } else {
            map.setView({
                lat: lat,
                lng: lng
            });
        }

        setTimeout(function() {
            Utils.goTo('layer/' + parentLabel.replace(/ /g, '_') + '/' + id);
        }, Utils.isBrowser() ? 500 : 0);
    };

    window.goToUtfGridDetail = function(id, parentLabel) {
        Utils.goTo('ulayer/' + parentLabel.replace(/ /g, '_') + '/' + id);
    };

    window.goToTileUtfGridDetail = function(id, parentLabel, lat, lng) {
        map.setView({
            lat: lat,
            lng: lng
        });
        Utils.goTo('layer/' + parentLabel.replace(/ /g, '_') + '/' + id);
    };

    setTimeout(function() {
        mapService.adjust();
    }, 3600);

    return mapService;
});
