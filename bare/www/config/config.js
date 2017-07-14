angular.module('webmapp').constant('GENERAL_CONFIG', {
    'VERSION': '0.4',
    'OPTIONS': {
        'title': 'Webmapp Core',
        'startUrl': '/',
        'useLocalStorageCaching': true,
        'advancedDebug': false,
        'hideHowToReach': true,
        'hideMenuButton': false,
        'hideExpanderInDetails': false,
        'hideFiltersInMap': false,
        'hideDeactiveCentralPointer': true,
        'hideShowInMapFromSearch': true,
        'avoidModalInDetails': true,
        'useAlmostOver': false,
        'filterIcon': 'wm-icon-layers'
    },
    "STYLE": {
        "global": {
            "background": "#F3F6E9",
            "color": "black",
            "centralPointerActive": "black",
            "buttonsBackground": "#486C2C",
            "buttonsColor": '#FFF'
        },
        "details": {
            "background": "#F3F6E9",
            "buttons": "rgba(56, 126, 245, 0.78)",
            "color": "#929077"
        },
        "subnav": {
            "color": "white",
            "background": "#486C2C"
        },
        "mainBar": {
            "color": "white",
            "background": "#486C2C",
            "overwrite": true
        },
        "menu": {
            "color": "black",
            "background": "#F3F6E9"
        },
        "search": {
            "color": "#486C2C"
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
    'ADVANCED_DEBUG': false,
    'COMMUNICATION': {
        'baseUrl': 'http://pnfc.cbe.webmapp.it',
        'resourceBaseUrl': 'http://pnfc.cbe.webmapp.it/geojson'
    },
    'SEARCH': {
        'active': true,
        'indexFields': [
            'name',
            'description',
            'email',
            'address'
        ],
        'showAllByDefault': true,
        'stemming': true,
        'removeStopWords': true,
        'indexStrategy': 'AllSubstringsIndexStrategy',
        'TFIDFRanking': true
    },
    'MENU': [
        {
            'label': 'Mappa',
            'type': 'map',
            'color': '#486C2C',
            'icon': 'wm-icon-generic'
        },
        {
            'label': 'Punti di interesse',
            'type': 'layerGroup',
            'color': '#E94C31',
            'icon': 'wm-icon-generic',
            'items': [
                'Centri Visita e Punti Informazione',
                'Ente Parco e CFS-UTB',
                'Musei e Poli Didattici',
                'Rifugi e Punti Tappa'
            ]
        },
        {
            'label': 'Sentieri tematici',
            'type': 'layer',
            'color': '#e94c31',
            'icon': 'wm-icon-trail'
        },
        {
            'label': 'Mappa Offline',
            'type': 'page'
        },
        {
            'label': 'About',
            'type': 'pageGroup',
            'items': [
                'Il progetto',
                'Parco sicuro',
                'Legenda',
                'Attribution',
                'Webmapp'
            ]
        }
    ],
    'OFFLINE': {
        "baseUrl": "http://pnfc.cbe.webmapp.it/",
        "resourceBaseUrl": "http://pnfc.cbe.webmapp.it/geojson/",
        "pagesUrl" : "http://api.webmapp.it/be/pnfc.cbe.webmapp.it/pages/",
        'url': 'http://api.webmapp.it/pnfc/tiles/map.zip',
        'urlMbtiles': 'http://api.webmapp.it/be/pnfc.cbe.webmapp.it/tiles/map.mbtiles',
        'urlImages': 'http://api.webmapp.it/be/pnfc.cbe.webmapp.it/media/images.zip',
        'tms': true,
        'lastRelease': '2017-07-10'
    },

    'MAP': {
        'maxZoom': 16,
        'minZoom': 10,
        'defZoom': 14,
        'center': {
            'lat': 43.8704,
            'lng': 11.7327
        },
        'bounds': {
            'southWest': [
                43.6723,
                11.5739
            ],
            'northEast': [
                44.0959,
                11.9923
            ]
        },
        'markerClustersOptions': {
            'spiderfyOnMaxZoom': true,
            'showCoverageOnHover': false,
            'maxClusterRadius': 60,
            'disableClusteringAtZoom': 17
        },
        'showCoordinatesInMap': true,
        'showScaleInMap': true,
        'hideZoomControl': false,
        'hideLocationControl': false,
        'layers': [
            {
                'label': 'Mappa',
                'type': 'maptile',
                'tilesUrl': 'http://api.webmapp.it/pnfc/tiles/map/',
                'default': true
            }
        ]
    },
    'DETAIL_MAPPING': {
        'default': {
            'fields': {
                'title': 'name',
                'image': 'image',
                'description': 'description',
                'email': 'contact:email',
                'phone': 'contact:phone',
                'address': 'address'
            },
            'table': {
                'ref': 'Percorso',
                'distance': 'Lunghezza',
                'ascent': 'Dislivello positivo',
                'descent': 'Dislivello negativo',
                'duration:forward': 'Tempi',
                'duration:backward': 'Tempi in direzione contraria',
                'cai_scale': 'Difficoltà'
            },
            'urls': {
                'url': 'Vai al sito web'
            }
        }
    },
    'PAGES': [
        {
            "label": "Il progetto",
            "type": "progetto",
            "isCustom": true,
            "color": "#486c2c",
            "icon": "wm-icon-android-lightbulb"
        },
        {
            "label": "Parco sicuro",
            "type": "parcosicuro",
            "isCustom": true,
            "color": "#486c2c",
            "icon": "wm-icon-fc-corpo-forestale"
        },
        {
            "label": "Legenda",
            "type": "legenda",
            "isCustom": true,
            "color": "#486c2c",
            "icon": "wm-icon-android-drawer"
        },
        {
            "label": "Attribution",
            "type": "credits",
            "isCustom": true,
            "color": "#486c2c",
            "icon": "wm-icon-info"
        },
        {
            "label": "Webmapp",
            "type": "webmapp",
            "isCustom": true,
            "color": "#63625d",
            "icon": "wm-icon-mappalo"
        },
        {
            'label': 'Mappa Offline',
            'type': 'settings',
            'isCustom': false,
        }
    ],
    'OVERLAY_LAYERS': [
        {
            'geojsonUrl': 'pois_8.geojson',
            'label': 'Centri Visita e Punti Informazione',
            'color': '#486c2c',
            'icon': 'wm-icon-info',
            'showByDefault': true,
            'type': 'poi_geojson'
        },
        {
            'geojsonUrl': 'pois_6.geojson',
            'label': 'Ente Parco e CFS-UTB',
            'color': '#ffa500',
            'icon': 'wm-icon-fc-sede',
            'showByDefault': true,
            'type': 'poi_geojson'
        },
        {
            'geojsonUrl': 'pois_7.geojson',
            'label': 'Musei e Poli Didattici',
            'color': '#008000',
            'icon': 'wm-icon-garden',
            'showByDefault': true,
            'type': 'poi_geojson'
        },
        {
            'geojsonUrl': 'pois_5.geojson',
            'label': 'Rifugi e Punti Tappa',
            'color': '#e94c31',
            'icon': 'wm-icon-alpine-hut',
            'showByDefault': true,
            'type': 'poi_geojson'
        },
        {
            'geojsonUrl': 'tracks_10.geojson',
            'label': 'Sentieri tematici',
            'color': '#e94c31',
            'icon': 'wm-icon-trail',
            'showByDefault': true,
            'type': 'line_geojson'
        }
    ]
});