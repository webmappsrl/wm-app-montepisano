angular.module('webmapp').constant('GENERAL_CONFIG', {
    "VERSION": "0.4",
    "OPTIONS": {
        "title": "DEV408 &#8211; MMP",
        "startUrl": "\/",
        "useLocalStorageCaching": false,
        "advancedDebug": false,
        "useExandMapInDetails": false,
        "hideHowToReach": true,
        "hideMenuButton": false,
        "hideExpanderInDetails": false,
        "hideFiltersInMap": false,
        "hideDeactiveCentralPointer": true,
        "hideShowInMapFromSearch": true,
        "avoidModalInDetails": true,
        "useAlmostOver": false,
        "filterIcon": "wm-icon-layers",
        "UTM32Enabled": true
    },
    "STYLE": {
        "global": {
            "background": "#FAFAFA",
            "color": "black",
            "centralPointerActive": "black",
            "buttonsBackground": "rgba(56, 126, 245, 0.78)"
        },
        "details": {
            "background": "#F3F6E9",
            "buttons": "rgba(56, 126, 245, 0.78)",
            "color": "#929077"
        },
        "subnav": {
            "color": "white",
            "background": "#387EF5"
        },
        "mainBar": {
            "color": "white",
            "background": "#387EF5",
            "overwrite": true
        },
        "menu": {
            "color": "black",
            "background": "#F3F6E9"
        },
        "search": {
            "color": "#387EF5"
        },
        "images": {
            "background": "#e6e8de"
        },
        "line": {
            "default": {
                "color": "red",
                "weight": 5,
                "opacity": 0.65
            },
            "highlight": {
                "color": "#00FFFF",
                "weight": 6,
                "opacity": 1
            }
        }
    },
    "ADVANCED_DEBUG": false,
    "COMMUNICATION": {
        "baseUrl": "http:\/\/pisatest.j.webmapp.it",
        "resourceBaseUrl": "http:\/\/pisatest.j.webmapp.it\/geojson"
    },
    "SEARCH": {
        "active": true,
        "indexFields": ["name", "description", "email", "address"],
        "showAllByDefault": true,
        "stemming": true,
        "removeStopWords": true,
        "indexStrategy": "AllSubstringsIndexStrategy",
        "TFIDFRanking": true
    },
    "MENU": [{
        "label": "Mappa",
        "type": "map",
        "color": "#486C2C",
        "icon": "wm-icon-generic"
    }, {
        "label": "Punti di interesse",
        "type": "layerGroup",
        "color": "#E94C31",
        "icon": "wm-icon-generic",
        "items": ["Bar", "Ristoranti", "Servizi", "Storia e Cultura"]
    }, {
        "label": "A piedi in citt\u00e0",
        "type": "layer",
        "color": "#FF3812",
        "icon": "wm-icon-generic"
    }, {
        "label": "Informazioni",
        "type": "pageGroup",
        "items": ["Pagina Numero Uno", "Pagina Numero due"]
    }, {
        "label": "Mappa Offline",
        "type": "page"
    }],
    "MAP": {
        "maxZoom": "16",
        "minZoom": "10",
        "defZoom": "13",
        "center": {
            "lat": 43.744,
            "lng": 10.531
        },
        "bounds": {
            "northEast": [43.56984, 10.21466],
            "southWest": [43.87756, 10.6855]
        },
        "markerClustersOptions": {
            "spiderfyOnMaxZoom": true,
            "showCoverageOnHover": false,
            "maxClusterRadius": 60,
            "disableClusteringAtZoom": 17
        },
        "showCoordinatesInMap": true,
        "showScaleInMap": true,
        "hideZoomControl": false,
        "hideLocationControl": false,
        "layers": [{
            "label": "Mappa",
            "type": "maptile",
            "tilesUrl": "https:\/\/api.mappalo.org\/mappadeimontipisani_new\/tiles\/map\/",
            "default": true
        }]
    },
    "DETAIL_MAPPING": {
        "default": {
            "fields": {
                "title": "name",
                "image": "image",
                "description": "description",
                "email": "contact:email",
                "phone": "contact:phone",
                "address": "address"
            },
            "table": {
                "ref": "Percorso",
                "distance": "Lunghezza",
                "ascent": "Dislivello positivo",
                "descent": "Dislivello negativo",
                "duration:forward": "Tempi",
                "duration:backward": "Tempi in direzione contraria",
                "cai_scale": "Difficolt\u00e0"
            },
            "urls": {
                "url": "Vai al sito web"
            }
        }
    },
    "PAGES": [{
        "label": "Pagina Numero Uno",
        "type": "pagina-numero-uno",
        "isCustom": true
    }, {
        "label": "Pagina Numero due",
        "type": "pagina-numero-due",
        "isCustom": true,
        "color": "#dd3333",
        "icon": "wm-icon-manor"
    }, {
        "label": "Mappa Offline",
        "type": "settings",
        "isCustom": false
    }],
    "OVERLAY_LAYERS": [{
        "geojsonUrl": "pois_30.geojson",
        "label": "Bar",
        "color": "#00ff00",
        "icon": "wm-icon-siti-interesse",
        "showByDefault": true,
        "type": "poi_geojson"
    }, {
        "geojsonUrl": "pois_7.geojson",
        "label": "Ristoranti",
        "color": "#FF3812",
        "icon": "wm-icon-restaurant",
        "showByDefault": true,
        "type": "poi_geojson"
    }, {
        "geojsonUrl": "pois_9.geojson",
        "label": "Servizi",
        "color": "#FF3812",
        "icon": "wm-icon-generic",
        "showByDefault": true,
        "type": "poi_geojson"
    }, {
        "geojsonUrl": "pois_8.geojson",
        "label": "Storia e Cultura",
        "color": "#FF3812",
        "icon": "wm-icon-generic",
        "showByDefault": true,
        "type": "poi_geojson"
    }, {
        "geojsonUrl": "tracks_14.geojson",
        "label": "A piedi in citt\u00e0",
        "color": "#FF3812",
        "icon": "wm-icon-generic",
        "showByDefault": true,
        "type": "line_geojson"
    }],
    "OFFLINE": {
        "resourceBaseUrl": "http:\/\/pisatest.j.webmapp.it\/geojson\/",
        "pagesUrl": "http:\/\/pisatest.j.webmapp.it\/pages\/",
        "urlMbtiles": "http:\/\/pisatest.j.webmapp.it\/tiles\/map.mbtiles",
        "urlImages": "http:\/\/pisatest.j.webmapp.it\/media\/images.zip"
    }
});