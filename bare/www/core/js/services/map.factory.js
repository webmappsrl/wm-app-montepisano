/*global $, ionic, L, angular*/

angular.module('webmapp')

    .factory('MapService', function MapService(
        $ionicLoading,
        $q,
        $rootScope,
        $state,
        $timeout,
        $translate,
        CONFIG,
        Model,
        Offline,
        Search,
        Utils
    ) {
        var mapService = {};

        var map = null,
            baseView = {},
            layerControl = null,
            mainConf = CONFIG.MAIN ? CONFIG.MAIN : {},
            mapConf = CONFIG.MAP,
            menuConf = CONFIG.MENU,
            generalConf = CONFIG.OPTIONS,
            overlayLayersConf = CONFIG.OVERLAY_LAYERS,
            styleConf = CONFIG.STYLE,
            offlineConf = CONFIG.OFFLINE,
            communicationConf = CONFIG.COMMUNICATION,
            currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it",
            defaultLang = CONFIG.MAIN ? (CONFIG.MAIN.LANGUAGES && CONFIG.MAIN.LANGUAGES.actual ? CONFIG.MAIN.LANGUAGES.actual.substring(0, 2) : "it") :
                ((CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual) ? CONFIG.LANGUAGES.actual.substring(0, 2) : 'it'),
            routeDefaultLang = (CONFIG.MAIN && CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual) ? CONFIG.LANGUAGES.actual : 'it';

        var trackRecordingEnabled = !Utils.isBrowser() && CONFIG.NAVIGATION && CONFIG.NAVIGATION.enableTrackRecording;

        if (!Utils.isBrowser()) {
            generalConf.useAlmostOver = true;
        } else {
            generalConf.useAlmostOver = false;
        }

        var eventsList = [],
            eventsMap = {},
            couponsList = [],
            couponsMap = {},
            dataReady = false,
            pagesReady = false,
            layerCliked = null,
            useLocalCaching = generalConf.useLocalStorageCaching,
            centerCoords = {},
            centerCoordsUTM32 = {},
            eventsPromise, couponsPromise;

        var baseLayersByLabel = {},
            tileLayersByLabel = {},
            utfGridBaseLayerByLabel = {},
            utfGridOverlayLayersByLabel = {},
            overlayLayersByLabel = {},
            overlayLayersById = {},
            extraLayersByLabel = {},
            featureMapById = {},
            areaMapById = {},
            geojsonByLabel = {},
            itineraryRefByFeatureId = {},
            featuresIdByLayersMap = {};

        var overlayLayersQueueByLabel = {},
            queueLayerToActivate = null,
            queueEvents = false,
            markerClusters,
            interactionsDisabled = false;

        var updateHitsTimer;

        var skipAreaClick = null;

        var polylineDecoratorLayers = {},
            geojsonLayer = null;

        var activatedPopup = null,
            highlightedTrack = null,
            mapIsRotating = false,
            currentBearing = 0,
            bearingAnimation = {
                startBearing: null,
                endBearing: null,
                interval: null,
                startTime: null,
                duration: 100
            };

        var circleLocation = {
            position: null,
            accuracy: null,
            icon: "locationIcon"
        };
        var locationIcon = L.icon({
            iconUrl: 'core/images/location-icon.png',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
        });
        var locationIconArrow = L.icon({
            iconUrl: 'core/images/location-icon-arrow.png',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
        });

        var elevationControl = null;

        var db = new PouchDB('webmapp');

        var userTrackPolyline = null;

        var overlayLayersConfMap = overlayLayersConf.reduce(function (prev, curr) {
            prev[curr.label] = curr;
            return prev;
        }, {});

        var overlayLayersById = overlayLayersConf.reduce(function (prev, curr) {
            prev[curr.id] = curr;
            return prev;
        }, {});

        var groupConfMap = menuConf.reduce(function (prev, curr) {
            if (curr.type === 'layerGroup') {
                curr.layer = L.featureGroup();
                prev[curr.label] = curr;
            }
            return prev;
        }, {});

        var activeFilters = localStorage.activeFilters ?
            JSON.parse(localStorage.activeFilters) : overlayLayersConf.reduce(function (prev, curr) {
                if (!curr.skipRendering) {
                    prev[curr.label] = curr.showByDefault !== false;
                }
                return prev;
            }, {});

        var isAPOILayer = function (layerName) {
            return (overlayLayersConfMap[layerName] &&
                overlayLayersConfMap[layerName].type === 'poi_geojson') ||
                (extraLayersByLabel[layerName] &&
                    extraLayersByLabel[layerName].type === 'poi_geojson');
        };

        var isALineLayer = function (layerName) {
            return (overlayLayersConfMap[layerName] &&
                overlayLayersConfMap[layerName].type === 'line_geojson') ||
                (extraLayersByLabel[layerName] &&
                    extraLayersByLabel[layerName].type === 'line_geojson');
        };

        var getParentGroup = function (layerName) {
            var group;

            for (var i in groupConfMap) {
                if (groupConfMap[i].items.indexOf(layerName) !== -1) {
                    group = groupConfMap[i];
                    break;
                }
            }

            return group;
        };

        var getLayerByName = function (layerName) {
            return overlayLayersByLabel[layerName] ||
                extraLayersByLabel[layerName];
        };

        var fitBounds = function (bounds) {
            if (bounds && bounds.isValid()) {
                map.fitBounds(bounds, {
                    // paddingTopLeft: L.point(0, map.getSize().divideBy(2).y),
                    animate: true,
                    duration: 1,
                    easeLinearity: 1.0
                });
            }
        };

        var addLayer = function (layerName) {
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
                        } else {
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
                    if (generalConf.useAlmostOver) {
                        map.almostOver.addLayer(layer);
                    }
                }
            }
        };

        var removeLayer = function (layerName) {
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
                    map.removeLayer(utfGridOverlayLayersByLabel[layerName]);
                }
            }
        };

        var globalLineApplyStyle = function (feature) {
            if (typeof feature.properties === 'undefined') {
                return;
            }

            var overlayConf = feature.parent || {};

            if (feature.parent) {
                if (feature.parent.type === "tile_utfgrid_geojson" && ($state.current.name === "app.main.map" || +feature.properties.id !== +$state.params.id)) {
                    return {
                        color: feature.properties.color || overlayConf.color || styleConf.line.default.color,
                        weight: feature.properties.weight || overlayConf.weight || styleConf.line.default.weight,
                        opacity: 0
                    };
                }
                else {
                    return {
                        color: feature.properties.color || overlayConf.color || styleConf.line.default.color,
                        weight: feature.properties.weight || overlayConf.weight || styleConf.line.default.weight,
                        opacity: feature.properties.opacity || overlayConf.opacity || styleConf.line.default.opacity,
                        dashArray: feature.properties.dashArray || overlayConf.dashArray || styleConf.line.default.dashArray || []
                    };
                }
            }
            else {
                return {};
            }
        };

        var globalOnEachPOI = function (feature) {
            if (typeof feature.properties === 'undefined') {
                return;
            }

            var overlayConf = feature.parent || {};

            feature.properties.id = feature.properties.id || Utils.generateUID();
            feature.properties.icon = getFeatureIcon(feature, overlayConf);
            feature.properties.color = feature.properties.color || overlayConf.color;
            featureMapById[feature.properties.id] = feature;
            if (feature.parent && feature.parent.id) {
                if (!featuresIdByLayersMap[feature.parent.label]) {
                    featuresIdByLayersMap[feature.parent.label] = [];
                }
                if (!feature.properties.taxonomy) {
                    feature.properties.taxonomy = {};
                }
                if (!feature.properties.taxonomy.webmapp_category) {
                    feature.properties.taxonomy.webmapp_category = [];
                }
                if (feature.properties.taxonomy.webmapp_category.indexOf(feature.parent.id) == -1) {
                    feature.properties.taxonomy.webmapp_category.push(feature.parent.id);
                }
                featuresIdByLayersMap[feature.parent.label].push(feature.properties.id);
            }
            Model.addItemToLayer(feature, overlayConf);
        };

        var globalOnEachLine = function (feature) {
            if (typeof feature.properties === 'undefined') {
                return;
            }

            var overlayConf = feature.parent || {},
                currentRelatedPOIs;

            feature.properties.id = feature.properties.id || Utils.generateUID();
            feature.properties.icon = getFeatureIcon(feature, overlayConf);
            featureMapById[feature.properties.id] = feature;
            if (feature.parent && feature.parent.id) {
                if (!featuresIdByLayersMap[feature.parent.label]) {
                    featuresIdByLayersMap[feature.parent.label] = [];
                }

                if (!feature.properties.taxonomy) {
                    feature.properties.taxonomy = {};
                }
                if (!feature.properties.taxonomy.webmapp_category) {
                    feature.properties.taxonomy.webmapp_category = [];
                }
                if (feature.properties.taxonomy.webmapp_category.indexOf(feature.parent.id) == -1) {
                    feature.properties.taxonomy.webmapp_category.push(feature.parent.id);
                }
                featuresIdByLayersMap[feature.parent.label].push(feature.properties.id);
            }

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

        var setItemInLocalStorage = function (key, data) {
            var insert = function () {
                db.put({
                    _id: key,
                    data: data
                }).then(function () {
                    // console.log('Cached ' + key);
                }, function (err) {
                });
            };

            db.get(key).then(function (e) {
                db.remove(e)
                    .then(function () {
                        insert();
                    });
            }).catch(function () {
                insert();
            });
        };

        var getItemFromLocalStorage = function (key) {
            return db.get(key);
        };

        var removeItemFromLocalStorage = function (key) {
            db.get(key).then(function (e) {
                db.remove(e);
            });
        };

        var getFeatureIcon = function (feature, overlayLayer) {
            return feature.properties.icon ||
                overlayLayer.icon ||
                'wm-icon-generic';
        };

        var getFeatureMarkerColor = function (feature, overlayLayer) {
            return feature.properties.color ||
                feature.properties.color ||
                overlayLayer.color ||
                'grey';
        };

        var genericPointToLayer = function (overlayLayer, feature, latlng) {
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

        var activateHighlight = function (layer, style) {
            if (layer.setStyle) {
                layer.setStyle(style);
            }
        };

        var clearLayerHighlight = function () {
            if (highlightedTrack) {
                map.removeLayer(highlightedTrack);
                highlightedTrack = null;
            }

            map.eachLayer(function (layer) {
                if (layer.feature &&
                    layer.setStyle &&
                    layer.actived) {
                    layer.actived = false;
                    activateHighlight(layer, globalLineApplyStyle(layer.feature));
                }
            });
        };

        var resetLayers = function () {
            if (map === null) {
                return;
            }

            if (markerClusters) {
                markerClusters.clearLayers();
            }

            for (var i in overlayLayersByLabel) {
                if (!isAPOILayer(i)) {
                    removeLayer(i);
                }
            }

            for (var j in extraLayersByLabel) {
                if (!isAPOILayer(j)) {
                    removeLayer(j);
                }
            }
        };

        var activatePopup = function (e, isPOI) {
            if (interactionsDisabled) {
                clearLayerHighlight();
                return;
            }

            var getIncrement = function (n) {
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
                    var content = '<div class="popup-div" onclick="goToDetail(\'' + e.layer.feature.properties.id + '\', \'' + e.layer.feature.parent.label.replace("'", "\\'") + '\', \'' + isPOI + '\', \'' + goToDetails + '\', \'' + e.latlng.lat + '\', \'' + e.latlng.lng + '\')">';

                    if (e.layer.feature.properties.image) {
                        content = content +
                            '<div class="popup-img">' +
                            '<img src="' + Offline.getRealImageUrl(e.layer.feature.properties.image) + '" />' +
                            '</div>';
                    } else if (e.layer.feature.properties.imageGallery) {
                        content = content +
                            '<div class="popup-img">' +
                            '<img src="' + Offline.getRealImageUrl(e.layer.feature.properties.imageGallery[0].src) + '" />' +
                            '</div>';
                    } else {
                        content = content +
                            '<div class="popup-img">' +
                            '<div>' +
                            '<i class="icon ' + e.layer.feature.properties.icon + '"></i>' +
                            '</div>' +
                            '</div>';
                    }
                    var category = e.layer.feature.parent.label;

                    if (category.toLowerCase() === 'tappe' || category.toLowerCase() === 'stages') {
                        category = $translate.instant('Tappe');
                    } else if (e.layer.feature.parent.languages && e.layer.feature.parent.languages[currentLang]) {
                        category = e.layer.feature.parent.languages[currentLang];
                    } else if (e.layer.feature.parent.languages && e.layer.feature.parent.languages[defaultLang]) {
                        category = e.layer.feature.parent.languages[defaultLang];
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
                var content = '<div class="popup-div" onclick="goToTileUtfGridDetail(\'' + e.data.id + '\', \'' + e.parent.label + '\', \'' + e.latlng.lat + '\', \'' + e.latlng.lng + '\')">';

                content = content +
                    '<div class="popup-img">' +
                    '<div>' +
                    '<i class="icon wm-icon-trail"></i>' +
                    '</div>' +
                    '</div>';

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
                    '</div>';

                L.popup()
                    .setLatLng({
                        lat: e.latlng.lat,
                        lng: e.latlng.lng
                    })
                    .setContent(
                        content
                    )
                    .openOn(map);
            }
        };

        var isPOILayerDetail = function () {
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

        var isLineLayerDetail = function () {
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

        var lineClick = function (e) {
            if (isLineLayerDetail()) {
                return;
            }

            var layer = e.layer;

            clearLayerHighlight();
            layer.actived = true;
            layerCliked = true;
            activateHighlight(layer, styleConf.line.highlight);
            activatePopup(e);
        };

        var activateLineHandlers = function (linesLayer) {
            linesLayer.on('click', lineClick);

            if (Utils.isBrowser()) {
                linesLayer.on({
                    mouseover: function (e) {
                        if (isLineLayerDetail()) {
                            return;
                        }

                        var layer = e.layer;

                        if (layer.actived) {
                            return;
                        }

                        map.eachLayer(function (layer) {
                            if (layer.feature &&
                                layer.setStyle &&
                                !layer.actived) {
                                activateHighlight(layer, globalLineApplyStyle(layer.feature));
                            }
                        });

                        activateHighlight(layer, styleConf.line.highlight);
                        layer.bringToFront();
                    },
                    mouseout: function (e) {
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
            }
        };

        var activatePOIHandlers = function (pointsLayer) {
            pointsLayer.on('click', function (e) {
                if (isPOILayerDetail()) {
                    return;
                }

                activatePopup(e, true);
            });
        };

        var addFeaturesToFilteredLayer = function (groupedFeatures, fitToBounds, delayedFit) {
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
                pointToLayer: function (feature, latlng) {
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
                    if (typeof groupedFeatures[i][j] !== 'undefined' && typeof groupedFeatures[i][j].properties !== 'undefined') {
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

            if (generalConf.showArrows || (mainConf && mainConf.OPTIONS && mainConf.OPTIONS.showArrows)) {
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
                if (delayedFit) {
                    setTimeout(function () {
                        fitBounds(groupLayer.getBounds());
                    }, delayedFit);
                }
                else {
                    fitBounds(groupLayer.getBounds());
                }
            }

            return {
                poi: pointsLayer,
                line: linesLayer
            };
        };

        var initializeEvents = function () {
            var defer = $q.defer(),
                promise = defer.promise;

            if (CONFIG.EXTRA &&
                CONFIG.EXTRA.events) {

                var currentFromLocalStorage = localStorage.getItem(CONFIG.EXTRA.events.serverUrl);

                var eventCallback = function (data) {
                    angular.extend(eventsList, data);

                    for (var i in data) {
                        Model.addItemToContainer(data[i], 'events');
                        eventsMap[data[i].id] = data[i];
                    }

                    if (queueEvents) {
                        mapService.showEventsLayer();
                    }

                    defer.resolve();
                };

                if (useLocalCaching && currentFromLocalStorage) {
                    eventCallback(JSON.parse(currentFromLocalStorage));

                    $.getJSON(CONFIG.EXTRA.events.serverUrl, function (data) {
                        if (!Utils.isBrowser()) {
                            setItemInLocalStorage(CONFIG.EXTRA.events.serverUrl, data);
                        }
                        angular.extend(eventsList, data);
                    });
                } else {
                    $.getJSON(CONFIG.EXTRA.events.serverUrl, function (data) {
                        eventCallback(data);
                        if (!Utils.isBrowser()) {
                            setItemInLocalStorage(CONFIG.EXTRA.events.serverUrl, data);
                        }
                    }).fail(function () {
                        defer.reject();
                    });
                }
            }

            return promise;
        };

        var initializeOffers = function () {
            var defer = $q.defer(),
                promise = defer.promise;

            if (CONFIG.EXTRA &&
                CONFIG.EXTRA.coupons &&
                CONFIG.EXTRA.coupons.serverUrl) {
                $.getJSON(CONFIG.EXTRA.coupons.serverUrl, function (data) {
                    angular.extend(couponsList, data);
                    for (var i in data) {
                        data[i].body = data[i].body.replace(new RegExp(/href="([^\'\"]+)"/g), '');
                        couponsMap[data[i].id] = data[i];
                        Model.addItemToContainer(data[i], 'coupons');
                    }

                    defer.resolve(data);
                }).fail(function () {
                    defer.reject();
                });
            } else {
                defer.reject();
            }

            return promise;
        };

        var initializePages = function () {
            var pages = CONFIG.PAGES,
                promises = [];

            var requestPage = function (item, index) {
                if (item.isCustom) {
                    if (CONFIG.LANGUAGES && CONFIG.LANGUAGES.available) {
                        for (var pos in CONFIG.LANGUAGES.available) {
                            var url = (CONFIG.OFFLINE && CONFIG.OFFLINE.pagesUrl) ? CONFIG.OFFLINE.pagesUrl : (CONFIG.COMMUNICATION.baseUrl[CONFIG.COMMUNICATION.baseUrl.length - 1] === '/') ? CONFIG.COMMUNICATION.baseUrl + 'pages/' : CONFIG.COMMUNICATION.baseUrl + '/pages/';
                            url += item.type;

                            if (CONFIG.LANGUAGES.available[pos].substring(0, 2) !== CONFIG.LANGUAGES.actual.substring(0, 2)) {
                                url = url + "_" + CONFIG.LANGUAGES.available[pos].substring(0, 2);
                            }

                            url = url + '.html';
                            return getPagesHtml(url);
                        }
                    } else {
                        var url = CONFIG.OFFLINE.pagesUrl + item.type + ".html";
                        return getPagesHtml(url);
                    }
                }
            };

            var getPagesHtml = function (url) {
                var defer = $q.defer();
                $.get(url).then(function (data) {
                    var insert = function () {
                        db.put({
                            _id: url,
                            data: data
                        }).then(function () {
                            defer.resolve("si");
                        }).catch(function () {
                            defer.resolve("no");
                            console.log(url + " page not updated");
                        });
                    };

                    db.get(url).then(function (e) {
                        db.remove(e)
                            .then(function () {
                                insert();
                            });
                    }).catch(function () {
                        insert();
                    });

                },
                    function (error) {
                        defer.resolve("no");
                    });

                return defer.promise;
            };

            if (pages) {
                for (var i in pages) {
                    if (pages[i].isCustom) {
                        promises.push(requestPage(pages[i], i));
                    }
                }
            } else {
                pagesReady = true;
            }

            $q.all(promises).then(function () {
                pagesReady = true;
            }, function (err) {
                console.error(err);
                pagesReady = true;
            })
        };

        var initializeThen = function (currentOverlay) {
            var group = getParentGroup(currentOverlay.label);

            if (group) {
                if (overlayLayersByLabel[currentOverlay.label]) {
                    overlayLayersByLabel[currentOverlay.label].addTo(group.layer);
                }

                if (Object.keys(group.layer._layers).length === group.items.length) {
                    group.isReady = true;
                    if (queueLayerToActivate === group.label) {
                        mapService.activateLayer(queueLayerToActivate);
                        queueLayerToActivate = null;
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
            }
        };

        var initializeLayer = function (currentOverlay) {
            if (typeof overlayLayersQueueByLabel[currentOverlay.label] !== 'undefined') {
                return overlayLayersQueueByLabel[currentOverlay.label];
            }

            var defer = $q.defer(),
                promise = defer.promise;

            var poiCallback = function (data, currentOverlay) {
                var geoJsonOptions = {
                    pointToLayer: function (feature, latlng) {
                        return genericPointToLayer(currentOverlay, feature, latlng);
                    },
                    onEachFeature: function (feature) {
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

            var lineCallback = function (data, currentOverlay) {
                var geoJsonOptions = {
                    onEachFeature: function (feature, layer) {
                        if (!feature.parent) {
                            feature.parent = currentOverlay;
                        }
                        globalOnEachLine(feature, layer);

                        if (generalConf.showArrows || (CONFIG.MAIN && CONFIG.MAIN.OPTIONS.showArrows)) {
                            if (!polylineDecoratorLayers[currentOverlay.label]) {
                                polylineDecoratorLayers[currentOverlay.label] = {};
                            }

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
                    style: function (feature) {
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

            var available = false;

            if (CONFIG.MAIN && CONFIG.MAIN.LANGUAGES && (CONFIG.MAIN.LANGUAGES.actual || (CONFIG.MAIN.LANGUAGES.available && CONFIG.MAIN.LANGUAGES.available.length > 0))) {
                available = true;
            }
            else if (CONFIG.LANGUAGES && (CONFIG.LANGUAGES.actual || (CONFIG.LANGUAGES.available && CONFIG.LANGUAGES.available.length > 0))) {
                available = true;
            }

            var url = "",
                success = function (data) {
                    if (currentOverlay.type === 'line_geojson') {
                        lineCallback(data, currentOverlay);
                    } else if (currentOverlay.type === 'poi_geojson') {
                        poiCallback(data, currentOverlay);
                    }
                    if (!Utils.isBrowser()) {
                        setItemInLocalStorage(url, JSON.stringify(data));
                    }
                    delete overlayLayersQueueByLabel[currentOverlay.label];
                },
                fail = function (err) {
                    // console.warn('An error has occurred downloading geojson \'' + currentOverlay.geojsonUrl + '\'. This file could miss in the server or the app is offline, and will be skipped', err);
                    delete overlayLayersQueueByLabel[currentOverlay.label];
                    defer.resolve();
                };

            var baseUrl = '';
            if (currentOverlay.geojsonUrl.substring(0, 4) !== 'file') {
                baseUrl = offlineConf.resourceBaseUrl || communicationConf.resourceBaseUrl || '';

                if (baseUrl.substring(-1) !== '/') {
                    baseUrl += '/';
                }
            }

            if (Offline.isActive()) {
                overlayLayersQueueByLabel[currentOverlay.label] = getItemFromLocalStorage(baseUrl + currentOverlay.geojsonUrl)
                    .then(function (localContent) {
                        if (localContent.data) {
                            var data = JSON.parse(localContent.data);
                            if (currentOverlay.type === 'line_geojson') {
                                lineCallback(data, currentOverlay);
                            } else if (currentOverlay.type === 'poi_geojson') {
                                poiCallback(data, currentOverlay);
                            }
                        }
                        delete overlayLayersQueueByLabel[currentOverlay.label];
                    }).catch(function (err) {
                        console.error(err);
                        delete overlayLayersQueueByLabel[currentOverlay.label];
                        defer.resolve();
                    });
            } else {
                url = currentOverlay.geojsonUrl;
                if (available && routeDefaultLang !== currentLang) {
                    var split = currentOverlay.geojsonUrl.split('/');
                    url = "/languages/" + currentLang + "/" + split.pop();
                    url = split.join('/') + url;
                }
                url = baseUrl + url;
                overlayLayersQueueByLabel[currentOverlay.label] = $.getJSON(url, success).fail(function (err) {
                    if (available) {
                        url = currentOverlay.geojsonUrl;
                        if (defaultLang !== routeDefaultLang) {
                            var split = currentOverlay.geojsonUrl.split('/');
                            url = "/languages/" + defaultLang + "/" + split.pop();
                            url = split.join('/') + url;
                        }
                        url = baseUrl + url;
                        overlayLayersQueueByLabel[currentOverlay.label] = $.getJSON(url, success).fail(function (err) {
                            url = baseUrl + currentOverlay.geojsonUrl;
                            overlayLayersQueueByLabel[currentOverlay.label] = $.getJSON(url, success).fail(fail);
                        });
                    }
                    else {
                        overlayLayersQueueByLabel[currentOverlay.label] = $.getJSON(url, success).fail(function (err) {
                            url = baseUrl + currentOverlay.geojsonUrl;
                            overlayLayersQueueByLabel[currentOverlay.label] = $.getJSON(url, success).fail(fail);
                        });
                    }
                });
            }

            promise.then(function () {
                initializeThen(currentOverlay);
            });

            return promise;
        };

        var initializeUtfGridGeojson = function (currentOverlay) {
            if (typeof overlayLayersQueueByLabel[currentOverlay.label] !== 'undefined') {
                return overlayLayersQueueByLabel[currentOverlay.label];
            }

            var defer = $q.defer(),
                promise = defer.promise;

            var options = {
                minZoom: mapConf.minZoom,
                maxZoom: mapConf.maxZoom,
                bounds: getMaxBounds()
            };

            if (!currentOverlay.geojsonUrl ||
                !currentOverlay.tilesUrl ||
                !currentOverlay.gridUrl) {
                console.error('Specify geojsonUrl, tilesUrl and gridUrl in config');
                defer.reject();
                return promise;
            }

            var tilesUrl = currentOverlay.tilesUrl,
                tileLayer = currentOverlay.tilesUrl;

            if (Offline.isActive()) {
                tilesUrl = cordova.file.dataDirectory + "map/" + currentOverlay.label.replace(/ /, "_") + ".mbtiles";
                tileLayer = tileLayersByLabel[currentOverlay.label] = L.tileLayer.mbTiles(tilesUrl, options);
            }
            else {
                tileLayer = tileLayersByLabel[currentOverlay.label] = L.tileLayer(tilesUrl + '{z}/{x}/{y}.png', options);
            }

            // utfGridOverlayLayersByLabel[currentOverlay.label] = L.utfGridCanvas(tilesUrl + '{z}/{x}/{y}.grid.json', {
            //     idField: 'ref', // Expects UTFgrid to have a property 'ID' that indicates the feature ID
            //     buildIndex: true, // requires above field to be set properly
            //     // fillColor: 'green',
            //     // shadowBlur: 10,  // Number of pixels for blur effect
            //     // shadowColor: 'green',  // Color for shadow, if present.  Defaults to fillColor.
            //     // pointerCursor: true,
            //     debug: true // if true, show tile borders and tile keys
            // });

            // // TODO: temporary, to fix with leaflet update
            // utfGridOverlayLayersByLabel[currentOverlay.label].on('mouseover', function () {
            //     if (mapReference) {
            //         mapReference.style.cursor = 'pointer';
            //     }
            // });
            // utfGridOverlayLayersByLabel[currentOverlay.label].on('mouseout', function () {
            //     if (mapReference) {
            //         mapReference.style.cursor = 'default';
            //     }
            // });

            // utfGridOverlayLayersByLabel[currentOverlay.label].on('click', $.proxy(function (e) {
            //     if (skipAreaClick || !e.data) {
            //         skipAreaClick = null;
            //         return;
            //     }

            //     areaMapById[e.data.id] = angular.extend({}, {
            //         properties: e.data
            //     }, {
            //             parent: {
            //                 label: this.baseMapLabel,
            //                 mapping: this.baseMapMapping
            //             }
            //         });

            //     activatePopup(
            //         angular.extend(e, {
            //             parent: {
            //                 label: this.baseMapLabel,
            //                 mapping: this.baseMapMapping
            //             }
            //         })
            //     );

            //     mapService.highlightTrack(e.data.id, this.baseMapLabel);
            // }, {
            //         baseMapLabel: currentOverlay.label,
            //         baseMapMapping: currentOverlay.mapping
            //     }));

            // var currentFromLocalStorage = localStorage.getItem(offlineConf.resourceBaseUrl + currentOverlay.geojsonUrl);

            var utfgridCallback = function (data, currentOverlay, layerGroup) {
                utfGridOverlayLayersByLabel[currentOverlay.label] = layerGroup;

                var geoJsonOptions = {
                    onEachFeature: function (feature, layer) {
                        if (!feature.parent) {
                            feature.parent = currentOverlay;
                        }
                        globalOnEachLine(feature, layer);
                    },
                    style: function (feature) {
                        if (!feature.parent) {
                            feature.parent = currentOverlay;
                        }
                        return globalLineApplyStyle(feature);
                    }
                },
                    linesLayer = L.geoJson(data, geoJsonOptions);

                overlayLayersByLabel[currentOverlay.label] = linesLayer;
                activateLineHandlers(linesLayer);

                // for (var i = 0; i < data.features.length; i++) {
                //     data.features[i].parent = currentOverlay;
                //     Model.addItemToLayer(data.features[i], currentOverlay);
                // }

                defer.resolve(angular.extend({
                    data: data
                }, currentOverlay));
            };

            if (Offline.isActive()) {
                getItemFromLocalStorage(offlineConf.resourceBaseUrl + currentOverlay.geojsonUrl)
                    .then(function (localContent) {
                        if (localContent.data) {
                            var data = JSON.parse(localContent.data);
                            utfgridCallback(data, currentOverlay, tileLayer);
                        }
                        delete overlayLayersQueueByLabel[currentOverlay.label];
                    }).catch(function () {
                        defer.resolve();
                    });
            } else {
                overlayLayersQueueByLabel[currentOverlay.label] = $.getJSON(offlineConf.resourceBaseUrl + currentOverlay.geojsonUrl, function (data) {
                    utfgridCallback(data, currentOverlay, tileLayer);
                    if (!Utils.isBrowser()) {
                        setItemInLocalStorage(offlineConf.resourceBaseUrl + currentOverlay.geojsonUrl, JSON.stringify(data));
                    }
                    delete overlayLayersQueueByLabel[currentOverlay.label];
                }).fail(function (err) {
                    defer.resolve();
                });
            }

            promise.then(function () {
                initializeThen(currentOverlay);
            });

            return promise;
        };

        var initializeLayers = function () {
            var promises = [];

            for (var i = overlayLayersConf.length - 1; i >= 0; i--) {
                if (!overlayLayersConf[i]) {
                    continue;
                }

                if (trackRecordingEnabled && overlayLayersConf[i].label === "I miei percorsi") {
                    continue;
                }

                if (overlayLayersConf[i].type === 'utfgrid') {
                    var utfGridmap = new L.UtfGrid(overlayLayersConf[i].url, {
                        useJsonP: false,
                        resolution: 4,
                        maxZoom: 16
                    }),
                        layerGroup = L.layerGroup([utfGridmap]);

                    layerControl.addOverlay(layerGroup);

                    utfGridmap.on('click', function (e) {
                        console.log('utfgrid click', e.data);
                    });
                } else {
                    //TODO control promise resolve/rejection of utfgrid
                    if (overlayLayersConf[i].type === 'poi_geojson' ||
                        overlayLayersConf[i].type === 'line_geojson') {
                        promises.push(initializeLayer(overlayLayersConf[i]));
                    } else if (overlayLayersConf[i].type === 'tile_utfgrid_geojson') {
                        promises.push(initializeUtfGridGeojson(overlayLayersConf[i]));
                    }
                }
            }

            eventsPromise = initializeEvents();
            couponsPromise = initializeOffers();

            var promiseCallback = function () {
                if (queueLayerToActivate !== null) {
                    if (queueLayerToActivate === '$all') {
                        mapService.showAllLayers();
                    } else {
                        mapService.activateLayer(queueLayerToActivate);
                    }

                    queueLayerToActivate = null;
                }

                dataReady = true;

                setTimeout(function () {
                    $ionicLoading.hide();

                    if (navigator.splashscreen) {
                        navigator.splashscreen.hide();
                    }
                }, 500);

                $rootScope.$$phase || $rootScope.$digest();
            }

            $q.all(promises).then(function () {
                promiseCallback();
            }, function (err) {
                // TODO find a way to wait until all promises responded
                console.warn('An error has occurred in utfgrid geojson files', err);
                setTimeout(function () {
                    promiseCallback();
                }, 2000);
            });
        };

        var getMaxBounds = function () {
            var southWest = L.latLng(mapConf.bounds.southWest),
                northEast = L.latLng(mapConf.bounds.northEast);

            return L.latLngBounds(southWest, northEast);
        };

        var resetOfflineData = function (e) {
            // @TODO local mbtiles file was not found. reset offline settings
            console.error('@TODO local mbtiles file was not found. reset offline settings');
        };

        var setBaseLayer = function (baseMap, baseTms, baseLayer) {
            if (baseMap.default) {
                var address = '',
                    regex = /.*\{z\}\/\{x\}\/\{y\}\.png.*/gm;
                if (regex.test(baseMap.tilesUrl)) {
                    address = baseMap.tilesUrl;
                } else {
                    address = baseMap.tilesUrl + '{z}/{x}/{y}.png';
                }
                Offline.setDefaultInfo(baseLayer, address, baseTms, mapService.resetView);
                localStorage.currentMapLayer = localStorage.currentMapLayer || baseMap.label;

                if (!baseLayersByLabel[localStorage.currentMapLayer]) {
                    localStorage.currentMapLayer = baseMap.label;
                }
            }

            baseLayersByLabel[baseMap.label] = baseLayer;
        };

        var buildBaseLayer = function (maxBounds, i) {
            return $q(function (resolve, reject) {
                var baseMap = mapConf.layers[i],
                    options = {},
                    baseLayer = null,
                    baseTms = false,
                    address = '';

                if (baseMap.type === 'maptile') {
                    options = {
                        minZoom: mapConf.minZoom,
                        maxZoom: mapConf.maxZoom,
                        // bounds: maxBounds
                    };

                    if (typeof baseMap.tms !== undefined && baseMap.tms) {
                        baseTms = options.tms = true;
                    }

                    if (Offline.isActive()) {
                        address = Offline.getOfflineUrl();
                        resolveLocalFileSystemURL(
                            address,
                            function (ap) {
                                var bl = L.tileLayer.mbTiles(address, options);
                                setBaseLayer(baseMap, baseTms, bl);
                                resolve();
                            },
                            resetOfflineData);
                    } else {
                        var regex = /.*\{z\}\/\{x\}\/\{y\}\.png.*/gm;
                        if (regex.test(baseMap.tilesUrl)) {
                            address = baseMap.tilesUrl;
                        } else {
                            address = baseMap.tilesUrl + '{z}/{x}/{y}.png';
                        }

                        $rootScope.$emit('basemap-style', {
                            grayscale: baseMap.grayscale,
                            opacity: baseMap.opacity
                        });
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

                    setTimeout(function () {
                        utfGridBaseLayerByLabel[baseMap.label].addTo(map);
                    }, 500);

                    utfGridBaseLayerByLabel[baseMap.label].on('click', $.proxy(function (e) {
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
                            function (ap) {
                                var bl = L.tileLayer.mbTiles(address, options);
                                setBaseLayer(baseMap, baseTms, bl);
                                resolve();
                            },
                            resetOfflineData);
                    }
                }
            });
        };

        var initialize = function () {
            if (map && map !== null) {
                return map;
            }

            if (typeof localStorage.$wm_mhildConf === 'undefined') {
                pagePromise = initializePages();
            }

            if (!mapConf.layers || mapConf.layers.length === 0) {
                if (navigator.splashscreen) {
                    navigator.splashscreen.hide();
                }
                return;
            }

            $ionicLoading.show({
                template: '<ion-spinner></ion-spinner>'
            });

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

            if (generalConf.activateZoomControl || (CONFIG.MAIN && CONFIG.MAIN.OPTIONS.activateZoomControl)) {
                L.control.zoom({
                    position: 'topright'
                }).addTo(map);
            }

            map.on('click', function () {
                $rootScope.$emit('map-click');
                if (layerCliked) {
                    layerCliked = null;
                    return;
                }

                clearLayerHighlight();
            });

            map.on('dragstart', function () {
                $rootScope.$emit('map-dragstart');
            });

            map.on('zoomstart', function () {
                mapService.closePopup();
                $rootScope.$emit('map-zoomstart');
                try {
                    elevationControl._hidePositionMarker();
                }
                catch (e) { }
            });

            map.on('resize', function () {
                $rootScope.$emit('map-resize');
            });

            map.on('moveend', function () {
                $rootScope.$emit('map-moveend');
            });

            if (generalConf.useAlmostOver) {
                map.on('almost:click', function (e) {
                    lineClick(e);
                    skipAreaClick = true;
                });
            }

            map.on('move', function () {
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

            map.on('zoomend', function () {
                var zoom = map.getZoom();
                if (zoom === +CONFIG.MAP.maxZoom) {
                    map.doubleClickZoom.disable();
                } else {
                    map.doubleClickZoom.enable();
                }
            });

            map.on('locationfound', function (location) {
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

            markerClusters = new L.MarkerClusterGroup({
                spiderfyOnMaxZoom: (mainConf.MAP && mainConf.MAP.markerClustersOptions && mainConf.MAP.markerClustersOptions.spiderifyOnMaxZoom) ? mainConf.MAP.markerClustersOptions.spiderifyOnMaxZoom : mapConf.markerClustersOptions.spiderfyOnMaxZoom,
                showCoverageOnHover: (mainConf.MAP && mainConf.MAP.markerClustersOptions && mainConf.MAP.markerClustersOptions.showCoverageOnHover) ? mainConf.MAP.markerClustersOptions.showCoverageOnHover : mapConf.markerClustersOptions.showCoverageOnHover,
                zoomToBoundsOnClick: false, // used markerClusters.on clusterclick instead
                maxClusterRadius: function (zoom) {
                    var disableAtZoom = (mainConf.MAP && mainConf.MAP.markerClustersOptions && mainConf.MAP.markerClustersOptions.disableClusteringAtZoom) ? mainConf.MAP.markerClustersOptions.disableClusteringAtZoom : mapConf.markerClustersOptions.disableClusteringAtZoom;
                    return (zoom < +disableAtZoom) ? ((mainConf.MAP && mainConf.MAP.markerClustersOptions && mainConf.MAP.markerClustersOptions.maxClusterRadius) ? mainConf.MAP.markerClustersOptions.maxClusterRadius : mapConf.markerClustersOptions.maxClusterRadius) : 1;
                }
            });

            markerClusters.addTo(map);

            markerClusters.on('clusterclick', function (a) {
                if (map.getZoom() < mapConf.maxZoom) {
                    map.fitBounds(a.layer.getBounds());
                    map.removeLayer(markerClusters);

                    setTimeout(function () {
                        markerClusters.addTo(map);
                    }, 500);
                } else {
                    map.setView({
                        lat: a.latlng.lat,
                        lng: a.latlng.lng
                    });
                }
            });

            if ((mainConf && mainConf.OPTIONS && mainConf.OPTIONS.activateElevationControl) || generalConf.activateElevationControl) {
                var width = +window.innerWidth,
                    height;

                if (width > 1024) {
                    width = width / 2;
                }

                width = ((width * 96 / 100) - 14);
                height = width / 3.5;

                elevationControl = L.control.elevation({
                    position: "bottomleft",
                    theme: "steelblue-theme", //default: lime-theme
                    width: width,
                    height: height,
                    margins: {
                        top: 30,
                        right: 35,
                        bottom: 30,
                        left: 50
                    },
                    hoverNumber: {
                        decimalsX: 2, //decimals on distance (always in km)
                        decimalsY: 0, //deciamls on height (always in m)
                        formatter: undefined //custom formatter function may be injected
                    },
                    collapsed: false  //collapsed mode, show chart on click or mouseover
                });
            }

            var baseLayersPromises = [];
            for (var i = 0; i < mapConf.layers.length; i++) {
                baseLayersPromises.push(buildBaseLayer(maxBounds, i));
            }

            $q.all(baseLayersPromises)
                .then(function () {
                    baseLayersByLabel[localStorage.currentMapLayer].addTo(map);
                })
                .catch(function (e) {
                    console.error(e);
                });

            layerControl = L.control.groupedLayers();
            layerControl.addTo(map);

            initializeLayers();

            if (trackRecordingEnabled) {
                getItemFromLocalStorage("$wm_userTracks").then(function (data) {
                    var userTracks = JSON.parse(data.data);
                    initializeUserTracksLayer(userTracks);
                }).catch(function (err) {
                    console.warn("$wm_userTracks: " + err.message);
                });
            }

            return map;
        };

        var reloadOverlayLayers = function () {
            if (!mapConf.layers || mapConf.layers.length === 0) {
                return;
            }

            resetLayers();

            utfGridBaseLayerByLabel = {};
            utfGridOverlayLayersByLabel = {};
            extraLayersByLabel = {};
            featureMapById = {};
            featuresIdByLayersMap = {};

            overlayLayersQueueByLabel = {};
            queueLayerToActivate = null;

            polylineDecoratorLayers = {};

            Search.clearEngine();
            Model.reloadLayers();
            initializeLayers();
        };

        mapService.arePagesReady = function () {
            return pagesReady;
        };

        mapService.getPageInPouchDB = function (key) {
            return db.get(key);
        };

        mapService.resetLoading = function () {
            $timeout.cancel(updateHitsTimer);
        };

        mapService.overlayLayersConfMap = function () {
            return overlayLayersConfMap;
        };

        mapService.getCurrentMapLayerName = function () {
            return localStorage.currentMapLayer;
        };

        mapService.activateMapLayer = function (layerName) {
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
                        setTimeout(function () {
                            mapService.activateLayer(i, true, true);
                        }, 100);
                    }
                }
            }
        };

        mapService.activateLayer = function (layerName, skipReset, skipFit, skipQueueReset) {
            var group = {},
                isGroup = group = Model.isAnOverlayGroup(layerName),
                groupLayer = L.featureGroup(),
                currentLayer;

            var layersCache = [];

            var addLayersGroup = function () {
                $timeout.cancel(updateHitsTimer);

                if (layersCache.length === 0) {
                    fitBounds(groupLayer.getBounds());
                    return;
                }

                var currentHits = 0,
                    maxHits = 1,
                    delay = 60;

                var doAdd = function () {
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

                updateHitsTimer = $timeout(function () {
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

        mapService.removeLayer = function (layerName) {
            if (map === null) {
                return;
            }

            removeLayer(layerName);
        };

        mapService.setFilter = function (layerName, value) {
            if (activeFilters[layerName] !== value) {
                activeFilters[layerName] = value;
                localStorage.setItem('activeFilters', JSON.stringify(activeFilters));

                if (!CONFIG.MAP.filters) {
                    if (activeFilters[layerName]) {
                        mapService.activateLayer(layerName, true, true);
                    } else {
                        mapService.removeLayer(layerName);
                    }
                }
            }
        };

        mapService.activateAllFilters = function () {
            for (var layerName in activeFilters) {
                mapService.activateLayer(layerName);
            }
        };

        mapService.getActiveFilters = function () {
            return activeFilters;
        };

        mapService.showEventsLayer = function () {
            var events = Model.getItemsByContainer('events'),
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

        mapService.showAllLayers = function () {
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

        mapService.activateUtfGrid = function () {
            for (var i in utfGridBaseLayerByLabel) {
                // map.addLayer(utfGridBaseLayerByLabel[i]);
                map.addLayer(overlayLayersByLabel[i]);
            }
        };

        mapService.resetUtfGridLayers = function () {
            for (var i in utfGridBaseLayerByLabel) {
                map.removeLayer(utfGridBaseLayerByLabel[i]);
            }
        };

        mapService.resetUtfGridOverlayLayers = function () {
            for (var i in utfGridOverlayLayersByLabel) {
                // map.removeLayer(utfGridOverlayLayersByLabel[i]);
                map.removeLayer(overlayLayersByLabel[i]);
            }
        };

        mapService.resetMapLayers = function () {
            if (map === null) {
                return;
            }

            for (var i in baseLayersByLabel) {
                map.removeLayer(baseLayersByLabel[i]);
            }
        };

        mapService.resetLayers = function () {
            resetLayers();
        };

        mapService.resetView = function () {
            if (!map) {
                initialize();
            }

            var lat = baseView.mapCenter.lat,
                lng = baseView.mapCenter.lng,
                zoom = baseView.defZoom;

            map.setView({
                lat: lat,
                lng: lng
            }, mapConf.defZoom);

            // TODO: temporary fix for tms switching
            setTimeout(function () {
                map.setView({
                    lat: lat,
                    lng: lng
                }, zoom);
            }, 10);
        };

        mapService.centerOnFeature = function (feature) {
            if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
                var bounds = L.geoJson(feature).getBounds();
                map.fitBounds(bounds);
            } else {
                map.setView({
                    lat: feature.geometry.coordinates[1],
                    lng: feature.geometry.coordinates[0]
                }, mapConf.maxZoom);
            }
        };

        mapService.centerOnCoords = function (lat, lng) {
            map.setView({
                lat: lat,
                lng: lng
            },
                CONFIG.MAP.maxZoom);
        };

        mapService.drawPosition = function (position) {
            if (map) {
                var newLatLng = new L.LatLng(position.latitude, position.longitude);

                if (!circleLocation.position) {
                    circleLocation.icon = "locationIcon";
                    circleLocation.position = L.marker([position.latitude, position.longitude], {
                        icon: locationIcon
                    }).addTo(map);
                } else {
                    circleLocation.position.setLatLng(newLatLng);
                }

                if (!circleLocation.accuracy && position.accuracy > 10) {
                    circleLocation.accuracy = L.circle([position.latitude, position.longitude], {
                        weight: 1,
                        color: '#3E82F7',
                        fillColor: '#3E82F7',
                        fillOpacity: 0.2,
                        radius: position.accuracy
                    }).addTo(map);
                } else if (circleLocation.accuracy && position.accuracy > 10) {
                    circleLocation.accuracy.setLatLng(newLatLng);
                    circleLocation.accuracy.setRadius(position.accuracy);
                } else if (circleLocation.accuracy && position.accuracy <= 10) {
                    try {
                        map.removeLayer(circleLocation.accuracy);
                    } catch (e) {
                        console.warn("Removing accuracy", e);
                    }
                    circleLocation.accuracy = null;
                }
            }
        };

        mapService.drawAccuracy = function (accuracy) {
            if (map) {
                if (circleLocation && !circleLocation.accuracy && accuracy > 10) {
                    var latLng = circleLocation.position.getLatLng();
                    circleLocation.accuracy = L.circle(latLng, {
                        weight: 1,
                        color: '#3E82F7',
                        fillColor: '#3E82F7',
                        fillOpacity: 0.2,
                        radius: accuracy
                    }).addTo(map);
                }
                else if (circleLocation && circleLocation.accuracy && accuracy > 10) {
                    circleLocation.accuracy.setRadius(accuracy);
                }
                else if (circleLocation && circleLocation.accuracy && accuracy <= 10) {
                    try {
                        map.removeLayer(circleLocation.accuracy);
                    } catch (e) {
                        console.warn("Removing accuracy", e);
                    }
                    circleLocation.accuracy = null;
                }
            }
        };

        mapService.togglePositionIcon = function (icon) {
            if (map) {
                if (icon !== circleLocation.icon) {
                    if (circleLocation.icon === "locationIcon") {
                        circleLocation.icon = "locationIconArrow";
                        circleLocation.position.setIcon(locationIconArrow);
                    } else {
                        circleLocation.icon = "locationIcon";
                        circleLocation.position.setIcon(locationIcon);
                    }
                }
            }
        };

        mapService.removePosition = function () {
            if (map) {
                if (circleLocation.position !== null) {
                    map.removeLayer(circleLocation.position);
                    circleLocation.position = null;
                }
                if (circleLocation.accuracy !== null) {
                    map.removeLayer(circleLocation.accuracy);
                    circleLocation.accuracy = null;
                }
            }
        };

        mapService.toggleElevationControl = function (data, node) {
            if (mainConf && mainConf.OPTIONS && mainConf.OPTIONS.activateElevationControl || generalConf.activateElevationControl) {
                try {
                    elevationControl.clear();
                }
                catch (e) { }

                if (data && data.geometry.type === 'LineString' && data.geometry.coordinates[0][2]) {
                    L.geoJson(data, {
                        onEachFeature: elevationControl.addData.bind(elevationControl)
                    });
                    elevationControl.addTo(map);

                    if (node) {
                        var htmlObject = elevationControl.getContainer();

                        function setParent(el, newParent) {
                            newParent.appendChild(el);
                        }
                        setParent(htmlObject, node);
                    }
                }
                else {
                    try {
                        elevationControl._hidePositionMarker();
                    }
                    catch (e) { }

                    try {
                        map.removeControl(elevationControl);
                    }
                    catch (e) { }
                }
            }
        };

        mapService.isInBoundingBox = function (lat, long) {
            // If !Multimap
            if (map) {
                var bounds = new L.latLngBounds(
                    new L.latLng(mapConf.bounds.southWest),
                    new L.latLng(mapConf.bounds.northEast));

                return bounds.contains(
                    new L.latLng(lat, long)
                );
            }
            else {
                return true;
            }
        };

        mapService.precacheOverlaysData = function () {
            for (var overlay in overlayLayersConf) {
                $.getJSON(overlayLayersConf[overlay].url, $.proxy(function (data) {
                    setItemInLocalStorage(overlayLayersConf[this.overlay].url, data);
                }, {
                    overlay: overlay
                }));
            }
        };

        mapService.adjust = function () {
            if (map) {
                clearLayerHighlight();
                map.invalidateSize();
                if ($rootScope.highlightTrack && $rootScope.highlightTrack.parentId && $rootScope.highlightTrack.id) {
                    if ($state.current.name === 'app.main.map') {
                        mapService.highlightTrack($rootScope.highlightTrack.id, $rootScope.highlightTrack.parentId, true);
                        $rootScope.highlightTrack = null;
                        delete $rootScope.highlightTrack;
                    }
                    else if ($state.current.name === 'app.main.layer') {
                        mapService.highlightTrack($rootScope.highlightTrack.id, $rootScope.highlightTrack.parentId, false);
                    }
                    else {
                        $rootScope.highlightTrack = null;
                        delete $rootScope.highlightTrack;
                    }
                }
            }
        };

        mapService.hasMap = function () {
            return map ? true : false;
        };

        mapService.initialize = function () {
            if (Utils.isBrowser()) {
                initialize();
            } else {
                document.addEventListener('deviceready', function () {
                    initialize();
                });
            }
        };

        mapService.resetMap = function () {
            if (map !== null) {
                map.remove();
                map = null;
            }
        };

        mapService.addFeaturesToFilteredLayer = function (groupedFeatures, fitToBounds, delayedFit) {
            addFeaturesToFilteredLayer(groupedFeatures, fitToBounds, delayedFit);
        };

        mapService.isReady = function () {
            return dataReady;
        };

        mapService.getBaseLayers = function () {
            return baseLayersByLabel;
        };

        mapService.getOverlayLayers = function () {
            return overlayLayersByLabel;
        };

        mapService.getOverlayLayerById = function (id) {
            return overlayLayersById[id];
        };

        mapService.getEventsList = function () {
            return eventsList;
        };

        mapService.getFeatureIdMap = function () {
            return featureMapById;
        };

        mapService.getFeaturesIdByLayersMap = function () {
            return featuresIdByLayersMap;
        };

        mapService.getFeatureById = function (id, layerName) {
            var defer = $q.defer();

            var checkNow = function () {
                if (featureMapById[id]) {
                    defer.resolve(featureMapById[id]);
                } else {
                    defer.reject();
                }
            };

            if (!dataReady) {
                setTimeout(function () {
                    mapService.getFeatureById(id, layerName).then(function (feature) {
                        defer.resolve(feature);
                    });
                }, 100);
            }
            else {
                if (typeof overlayLayersConfMap[layerName] === 'undefined') {
                    checkNow();
                }
                else {

                }

                if (overlayLayersByLabel[layerName]) {
                    checkNow();
                }
            }

            return defer.promise;
        };

        mapService.getRelatedFeaturesById = function (relatedId) {
            var features = [],
                newPos = 0;

            for (var pos in relatedId) {
                if (featureMapById[relatedId[pos]]) {
                    features[newPos] = featureMapById[relatedId[pos]];
                    newPos++;
                }
            }

            return features;
        };

        mapService.getAreaById = function (id) {
            var defer = $q.defer();

            if (typeof areaMapById[id] !== 'undefined') {
                defer.resolve(areaMapById[id]);
            } else {
                defer.reject();
            }

            return defer.promise;
        };

        mapService.getEventById = function (id) {
            var defer = $q.defer();

            var checkNow = function () {
                if (eventsMap[id]) {
                    defer.resolve(eventsMap[id]);
                } else {
                    defer.reject();
                }
            };

            if (eventsMap[id]) {
                checkNow();
            } else {
                setTimeout(function () {
                    eventsPromise.then(function () {
                        checkNow();
                    });
                }, 100);
            }

            return defer.promise;
        };

        mapService.getCouponById = function (id) {
            var defer = $q.defer();

            var checkNow = function () {
                if (couponsMap[id]) {
                    defer.resolve(couponsMap[id]);
                } else {
                    defer.reject();
                }
            };

            if (couponsMap[id]) {
                checkNow();
            } else {
                setTimeout(function () {
                    couponsPromise.then(function () {
                        checkNow();
                    });
                }, 100);
            }

            return defer.promise;
        };

        mapService.getItineraryRefByFeatureIdMap = function () {
            return itineraryRefByFeatureId;
        };

        mapService.getCenterCoordsReference = function () {
            if (!(centerCoords.lat || centerCoords.lng)) {
                centerCoords = {
                    lat: CONFIG.MAP.center.lat.toFixed(4),
                    lng: CONFIG.MAP.center.lng.toFixed(4)
                };
            }

            return centerCoords;
        };

        mapService.getCenterCoordsUTM32Reference = function () {
            return centerCoordsUTM32;
        };

        mapService.fitBounds = function (bounds) {
            fitBounds(bounds);
        };

        mapService.fitBoundsFromString = function (stringBounds) {
            var bsplit = stringBounds.split(','),
                swsplit = bsplit[0].split(' '),
                nesplit = bsplit[1].split(' '),
                southWest = L.latLng([swsplit[1], swsplit[0]]),
                northEast = L.latLng([nesplit[1], nesplit[0]]);

            fitBounds(L.latLngBounds(southWest, northEast));
        };

        mapService.getCouponsList = function () {
            return couponsList;
        };

        mapService.getBounds = function () {
            if (map) {
                return map.getBounds();
            }
        };

        mapService.isAPOILayer = function (layerName) {
            return isAPOILayer(layerName);
        };

        mapService.setBearing = function (n) {
            if (map) {
                currentBearing = n;
                map.setBearing(n);
            }
        }

        mapService.animateBearing = function (goal, duration) {
            if (map) {
                bearingAnimation.startTime = Date.now();
                currentBearing %= 360;
                goal %= 360;
                if (currentBearing - goal > 180) {
                    goal += 360;
                } else if (goal - currentBearing > 180) {
                    goal -= 360;
                }
                bearingAnimation.endBearing = goal;
                bearingAnimation.startBearing = currentBearing;
                bearingAnimation.duration = duration;

                if (!bearingAnimation.interval) {
                    bearingAnimation.interval = setInterval(function () {
                        var currentFrame = (Date.now() - bearingAnimation.startTime) / bearingAnimation.duration;

                        if (currentFrame >= 1) {
                            map.setBearing(bearingAnimation.endBearing);
                            clearInterval(bearingAnimation.interval);
                            if (bearingAnimation.endBearing < 0) {
                                bearingAnimation.endBearing %= 360;
                            }
                            currentBearing = bearingAnimation.endBearing;
                            bearingAnimation.interval = null;
                            bearingAnimation.startTime = null;
                            bearingAnimation.startBearing = null;
                            bearingAnimation.endBearing = null;
                            bearingAnimation.duration = 100;
                        } else {
                            currentFrame = Utils.cubicAnimation(currentFrame);
                            currentBearing = bearingAnimation.startBearing + ((bearingAnimation.endBearing - bearingAnimation.startBearing) * currentFrame);
                            map.setBearing(currentBearing);
                        }
                    }, 10);
                }
            }
        }

        mapService.setZoom = function (n) {
            map && map.setZoom(n);
        };

        mapService.getZoom = function () {
            return map.getZoom();
        };

        mapService.disableDrag = function () {
            map && map.dragging.disable();
        };

        mapService.enableDrag = function () {
            map && map.dragging.enable();
        };

        mapService.disableWheelZoom = function () {
            if (map) {
                map.scrollWheelZoom.disable();
            }
        };

        mapService.disableInteractions = function () {
            if (map) {
                map.dragging.disable();
                map.touchZoom.disable();
                map.doubleClickZoom.disable();
                map.scrollWheelZoom.disable();
                map.boxZoom.disable();
                map.keyboard.disable();
                if (map.tap) map.tap.disable();
                document.getElementById('map').style.cursor = 'default';
                interactionsDisabled = true;
            }
        };

        mapService.enableInteractions = function () {
            if (map) {
                map.dragging.enable();
                map.touchZoom.enable();
                map.doubleClickZoom.enable();
                map.scrollWheelZoom.enable();
                map.boxZoom.enable();
                map.keyboard.enable();
                if (map.tap) map.tap.enable();
                document.getElementById('map').style.cursor = 'grab';
                interactionsDisabled = false;
            }
        };

        mapService.centerOnScreen = function (location) {
            map.panTo(new L.LatLng(location.latlng.lat, location.latlng.lng));
        };

        mapService.showPathAndRelated = function (params) {
            var parentId = params.parentId,
                id = params.id;

            mapService.resetLayers();
            mapService.getFeatureById(id, parentId.replace(/_/g, ' '))
                .then(function (data) {
                    var featuresToShow = [data];

                    if (data.properties.id_pois) {
                        var related = mapService.getRelatedFeaturesById(data.properties.id_pois);
                        for (var i in related) {
                            if (related[i] && related[i].properties) {
                                featuresToShow = featuresToShow.concat([related[i]]);
                            }
                        }
                    }

                    mapService.addFeaturesToFilteredLayer({
                        'detail': featuresToShow
                    }, false);
                });
        };

        mapService.triggerNearestPopup = function (latLong) {
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

                            Utils.makeNotificationSound();
                        }
                        break;
                    }
                }
            } else {
                map.closePopup();
                activatedPopup = null;
            }
        };

        mapService.triggerFeatureClick = function (id) {
            if (map && featureMapById[id]) {
                var feature = angular.copy(featureMapById[id]);
                var obj = {
                    layer: {
                        feature: feature
                    },
                    latlng: {
                        lat: feature.geometry.coordinates[1],
                        lng: feature.geometry.coordinates[0]
                    }
                };

                if (feature.geometry.type === 'LineString') {
                    var pos = 0;
                    if (feature.geometry.coordinates.length % 2 === 1) {
                        pos = (feature.geometry.coordinates.length - 1) / 2;
                    } else {
                        pos = feature.geometry.coordinates.length / 2;
                    }
                    obj.latlng.lat = feature.geometry.coordinates[pos][1];
                    obj.latlng.lng = feature.geometry.coordinates[pos][0];
                } else if (feature.geometry.type === 'MultiLineString') {
                    var pos = 0,
                        totalLength = 0;

                    for (var i in feature.geometry.coordinates) {
                        totalLength += feature.geometry.coordinates[i].length;
                    }

                    pos = (totalLength - (totalLength % 2)) / 2;
                    var line = 0;

                    while (pos > 0) {
                        if (pos >= feature.geometry.coordinates[line].length) {
                            pos -= feature.geometry.coordinates[line].length;
                            line++;
                        } else {
                            break;
                        }
                    }

                    obj.latlng.lat = feature.geometry.coordinates[line][pos][1];
                    obj.latlng.lng = feature.geometry.coordinates[line][pos][0];
                }

                setTimeout(function () {
                    activatePopup(obj, feature.geometry.type === 'LineString' ? false : true);
                }, 1000);
            }
        };

        mapService.highlightTrack = function (id, parentId, fitBounds) {
            mapService.getFeatureById(id, parentId.replace(/_/g, ' '))
                .then(function (feature) {
                    if (feature.geometry && feature.geometry.type && feature.geometry.type === "LineString" || feature.geometry.type === "MultiLineString") {
                        var style = globalLineApplyStyle(feature);
                        highlightedTrack = L.geoJson(feature.geometry, {
                            color: styleConf.line.highlight.color,
                            weight: style.weight,
                            opacity: 1
                        });
                        highlightedTrack.addTo(map);
                        if (fitBounds) {
                            map.fitBounds(highlightedTrack.getBounds());
                        }
                    }
                });

            map.eachLayer(function (layer) {
                activateHighlight(layer, styleConf.line.highlight.color)
            });
        };

        mapService.mapIsRotating = function (isRotating) {
            map.closePopup();
            mapIsRotating = isRotating;
        };

        mapService.createGeojsonLayer = function (geojsonArray) {
            if (map) {
                if (geojsonLayer) {
                    map.removeLayer(geojsonLayer);
                }

                geojsonLayer = L.geoJSON(geojsonArray).addTo(map);
                setTimeout(function () {
                    map.fitBounds(geojsonLayer.getBounds());
                }, 500);

                map.fire('click');
            }
        };

        mapService.setItemInLocalStorage = function (key, item) {
            setItemInLocalStorage(key, item);
        };

        mapService.getItemFromLocalStorage = function (key) {
            return getItemFromLocalStorage(key);
        };

        mapService.removeItemFromLocalStorage = function (key) {
            removeItemFromLocalStorage(key);
        };

        var initializeUserTracksLayer = function (data) {
            var userOverlay = overlayLayersConfMap["I miei percorsi"];

            if (userOverlay) {
                var geoJsonOptions = {
                    onEachFeature: function (feature, layer) {
                        if (!feature.parent) {
                            feature.parent = userOverlay;
                        }
                        globalOnEachLine(feature, layer);

                        if (generalConf.showArrows || (CONFIG.MAIN && CONFIG.MAIN.OPTIONS.showArrows)) {
                            if (!polylineDecoratorLayers[userOverlay.label]) {
                                polylineDecoratorLayers[userOverlay.label] = {};
                            }

                            polylineDecoratorLayers[userOverlay.label][feature.properties.id] = L.polylineDecorator(layer, {
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

                            polylineDecoratorLayers[userOverlay.label][feature.properties.id].addTo(map);
                        }
                    },
                    style: function (feature) {
                        if (!feature.parent) {
                            feature.parent = userOverlay;
                        }
                        return globalLineApplyStyle(feature);
                    }
                },
                    linesLayer = L.geoJson(data, geoJsonOptions);

                overlayLayersByLabel[userOverlay.label] = linesLayer;
                mapService.activateLayer(userOverlay.label, true, true, true);
                activateLineHandlers(linesLayer);
                if (!activeFilters['I miei percorsi']) {
                    mapService.removeLayer('I miei percorsi');
                } else {
                    //TODO redraw filtered layer
                }
                $rootScope.$emit('updatedTracks', data && data.features && data.features.length);
            }
        };

        mapService.createUserPolyline = function (coordsArray) {
            if (mapService.hasMap()) {
                if (userTrackPolyline) {
                    map.removeLayer(userTrackPolyline);
                }
                userTrackPolyline = L.polyline(coordsArray).addTo(map);
            }
        };

        mapService.updateUserPolyline = function (latLng) {
            if (userTrackPolyline) {
                userTrackPolyline.addLatLng(latLng);
                userTrackPolyline.redraw();
            } else {
                userTrackPolyline = L.polyline(latLng).addTo(map);
            }
        };

        mapService.getUserPolyline = function () {
            return userTrackPolyline;
        };

        mapService.removeUserPolyline = function () {
            if (userTrackPolyline) {
                map.removeLayer(userTrackPolyline);
                userTrackPolyline = null;
            }
        };

        mapService.saveUserPolyline = function (info) {
            if (userTrackPolyline) {
                var finallyFun = function () {
                    tmp.push(geoUserTrack);

                    var featureCollection = {
                        type: "FeatureCollection",
                        features: tmp
                    };

                    setItemInLocalStorage("$wm_userTracks", JSON.stringify(featureCollection));

                    mapService.removeLayer("I miei percorsi");
                    if (polylineDecoratorLayers["I miei percorsi"]) {
                        polylineDecoratorLayers["I miei percorsi"] = {};
                    }
                    Model.removeLayerItems({
                        label: "I miei percorsi"
                    });

                    initializeUserTracksLayer(featureCollection);
                };

                var geoUserTrack = userTrackPolyline.toGeoJSON();
                geoUserTrack.properties = angular.extend(geoUserTrack.properties, info);
                // geoUserTrack.properties.name = info.name;
                // geoUserTrack.properties.description = info.description;
                geoUserTrack.properties.isEditable = true;

                if (CONFIG.routeID) {
                    geoUserTrack.properties.routeID = CONFIG.routeID;
                }

                var tmp = [];
                geoUserTrack.properties.id = 1000000;

                getItemFromLocalStorage("$wm_userTracks").then(function (data) {
                    var collection = JSON.parse(data.data);
                    tmp = collection.features;

                    if (tmp.length) {
                        var lastElement = tmp[tmp.length - 1];
                        if (lastElement && lastElement.properties && lastElement.properties.id) {
                            geoUserTrack.properties.id = lastElement.properties.id + 1;
                        }
                    }
                    finallyFun();
                }).catch(function (err) {
                    console.warn(err);
                    finallyFun();
                });
            }
        };

        mapService.deleteUserTrack = function (id) {
            getItemFromLocalStorage("$wm_userTracks").then(function (data) {
                var collection = JSON.parse(data.data);

                if (collection) {
                    var tmp = collection.features;
                    var find = false;
                    for (var i = 0; i < tmp.length; i++) {
                        var feature = tmp[i];
                        if (feature.properties.id == id) {
                            tmp.splice(i, 1);
                            find = true;
                            break;
                        }
                    }

                    if (find) {
                        var featureCollection = {
                            type: "FeatureCollection",
                            features: tmp
                        };

                        setItemInLocalStorage("$wm_userTracks", JSON.stringify(featureCollection));

                        mapService.removeLayer("I miei percorsi");
                        if (polylineDecoratorLayers["I miei percorsi"]) {
                            polylineDecoratorLayers["I miei percorsi"] = {};
                        }
                        Model.removeLayerItems({
                            label: "I miei percorsi"
                        });

                        delete featureMapById[id];
                        delete featuresIdByLayersMap['I miei percorsi'];

                        initializeUserTracksLayer(featureCollection);
                    }
                }
            }).catch(function (err) {
                console.warn(err);
            });
        };

        mapService.getUserTrackGeoJSON = function (id) {
            var deferred = $q.defer();
            getItemFromLocalStorage("$wm_userTracks").then(function (data) {
                var collection = JSON.parse(data.data);
                if (collection) {
                    var tmp = collection.features;
                    var featureGeoJSON;
                    for (var i = 0; i < tmp.length; i++) {
                        var feature = tmp[i];
                        if (feature.properties.id == id) {
                            featureGeoJSON = feature;
                            break;
                        }
                    }

                    if (featureGeoJSON) {
                        deferred.resolve(featureGeoJSON);
                    } else {
                        deferred.reject(err);
                    }
                }
            }).catch(function (err) {
                deferred.reject(err);
                console.warn(err);
            });

            return deferred.promise;

        }

        mapService.editUserTrack = function (id, name, descr) {
            return getItemFromLocalStorage("$wm_userTracks").then(function (data) {
                var collection = JSON.parse(data.data);
                if (collection) {
                    var tmp = collection.features;
                    var find = false;

                    for (var i = 0; i < tmp.length; i++) {
                        var feature = tmp[i];

                        if (feature.properties.id == id) {
                            feature.properties.name = name;
                            feature.properties.description = descr;
                            find = true;
                            break;
                        }
                    }

                    if (find) {
                        var featureCollection = {
                            type: "FeatureCollection",
                            features: tmp
                        };

                        setItemInLocalStorage("$wm_userTracks", JSON.stringify(featureCollection));

                        mapService.removeLayer("I miei percorsi");
                        if (polylineDecoratorLayers["I miei percorsi"]) {
                            polylineDecoratorLayers["I miei percorsi"] = {};
                        }
                        Model.removeLayerItems({
                            label: "I miei percorsi"
                        });
                        delete featureMapById[id];
                        delete featuresIdByLayersMap['I miei percorsi'];
                        initializeUserTracksLayer(featureCollection);
                    }
                }
            }).catch(function (err) {
                console.warn(err);
            });
        };

        $rootScope.$on('language-changed', function () {
            currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";
            reloadOverlayLayers();
        });

        window.closePopup = mapService.closePopup = function (e) {
            map && map.closePopup();
            try {
                event && event.stopPropagation();
            } catch (err) { }
        };

        window.goToDetail = function (id, parentLabel, isPOI, goToDetails, lat, lng) {
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

            setTimeout(function () {
                Utils.goTo('layer/' + parentLabel.replace(/ /g, '_') + '/' + id);
            }, Utils.isBrowser() ? 500 : 0);
        };

        window.goToUtfGridDetail = function (id, parentLabel) {
            Utils.goTo('ulayer/' + parentLabel.replace(/ /g, '_') + '/' + id);
        };

        window.goToTileUtfGridDetail = function (id, parentLabel, lat, lng) {
            map.setView({
                lat: lat,
                lng: lng
            });
            Utils.goTo('layer/' + parentLabel.replace(/ /g, '_') + '/' + id);
        };

        return mapService;
    });
