var MOCK_CONFIG = {
    "VERSION": "0.1.1714",
    "appId": "it.webmapp.testpisa",
    "OPTIONS": {
        "title": "CONFIGTEST",
        "startUrl": "/",
        "useLocalStorageCaching": false,
        "advancedDebug": false,
        "hideHowToReach": false,
        "hideMenuButton": false,
        "hideExpanderInDetails": false,
        "hideFiltersInMap": false,
        "hideDeactiveCentralPointer": false,
        "hideShowInMapFromSearch": true,
        "avoidModalInDetails": true,
        "useAlmostOver": true,
        "filterIcon": "wm-icon-layers",
        "activateZoomControl": true,
        "mainMenuHideWebmappPage": false,
        "mainMenuHideAttributionPage": false,
        "showAccessibilityButtons": true,
        "allowCoordsShare": true
    },
    "STYLE": {
        "global": {
            "background": "#FAFAFA",
            "color": "black",
            "centralPointerActive": "black",
            "buttonsBackground": "rgba(56, 126, 245, 0.78)",
            "buttonsColor": "#FAFAFA"
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
        "baseUrl": "http://pisatest.j.webmapp.it",
        "resourceBaseUrl": "http://pisatest.j.webmapp.it/geojson"
    },
    "SEARCH": {
        "active": false
    },
    "MENU": [
        {
            "label": "Mappa",
            "type": "map",
            "color": "#486C2C",
            "icon": "wm-icon-generic"
        },
        {
            "label": "Punti di interesse",
            "type": "layerGroup",
            "color": "#E79E19",
            "icon": "wm-icon-generic",
            "items": [
                "Bar",
                "Ristoranti",
                "Servizi",
                "Storia e Cultura",
                "test IT"
            ]
        },
        {
            "label": "Percorsi",
            "type": "layerGroup",
            "color": "#E94C31",
            "icon": "wm-icon-generic",
            "items": [
                "A piedi in città",
                "Cicloescursionismo",
                "Escursionismo"
            ]
        },
        {
            "label": "Pagina Numero Uno",
            "type": "page"
        },
        {
            "label": "Pagina Numero due",
            "type": "page",
            "color": "#dd3333",
            "icon": "wm-icon-manor"
        },
        {
            "label": "Home",
            "type": "page"
        },
        {
            "label": "Mappa Offline",
            "type": "page",
            "hideInBrowser": true
        },
        {
            "label": "Cambia lingua",
            "type": "page"
        }
    ],
    "MAP": {
        "maxZoom": "16",
        "minZoom": "10",
        "defZoom": "13",
        "center": {
            "lat": 43.744,
            "lng": 10.531
        },
        "bounds": {
            "northEast": [
                60,
                40
            ],
            "southWest": [
                -50,
                -50
            ]
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
        "layers": [
            {
                "label": "Mappa",
                "type": "maptile",
                "tilesUrl": "https://api.webmapp.it/tiles/",
                "default": true
            }
        ]
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
                "cai_scale": "Difficoltà"
            },
            "urls": {
                "url": "Vai al sito web"
            }
        }
    },
    "PAGES": [
        {
            "label": "Pagina Numero Uno",
            "type": "pagina-numero-uno",
            "isCustom": true
        },
        {
            "label": "Pagina Numero due",
            "type": "pagina-numero-due",
            "isCustom": true,
            "color": "#dd3333",
            "icon": "wm-icon-manor"
        },
        {
            "label": "Home",
            "type": "home",
            "isCustom": true
        },
        {
            "label": "Mappa Offline",
            "type": "settings",
            "isCustom": false
        },
        {
            "label": "Cambia lingua",
            "type": "languages",
            "isCustom": false
        }
    ],
    "OVERLAY_LAYERS": [
        {
            "id": 30,
            "geojsonUrl": "pois_30.geojson",
            "label": "Bar",
            "color": "#00ff00",
            "icon": "wm-icon-siti-interesse",
            "showByDefault": true,
            "type": "poi_geojson",
            "alert": false,
            "languages": {
                "it": "Bar",
                "en": "bar"
            }
        },
        {
            "id": 7,
            "geojsonUrl": "pois_7.geojson",
            "label": "Ristoranti",
            "color": "#FF3812",
            "icon": "wm-icon-restaurant",
            "showByDefault": true,
            "type": "poi_geojson",
            "alert": false,
            "languages": {
                "it": "Ristoranti",
                "en": "Restaurants"
            }
        },
        {
            "id": 9,
            "geojsonUrl": "pois_9.geojson",
            "label": "Servizi",
            "color": "#FF3812",
            "icon": "wm-icon-generic",
            "showByDefault": true,
            "type": "poi_geojson",
            "alert": false,
            "languages": {
                "it": "Servizi",
                "en": "services"
            }
        },
        {
            "id": 8,
            "geojsonUrl": "pois_8.geojson",
            "label": "Storia e Cultura",
            "color": "#FF3812",
            "icon": "wm-icon-generic",
            "showByDefault": true,
            "type": "poi_geojson",
            "alert": false,
            "languages": {
                "it": "Storia e Cultura",
                "en": "History and Culture"
            }
        },
        {
            "id": 35,
            "geojsonUrl": "pois_35.geojson",
            "label": "test IT",
            "color": "#FF3812",
            "icon": "wm-icon-generic",
            "showByDefault": true,
            "type": "poi_geojson",
            "alert": false,
            "languages": {
                "it": "test IT",
                "en": "test EN"
            }
        },
        {
            "id": 14,
            "geojsonUrl": "tracks_14.geojson",
            "label": "A piedi in città",
            "color": "#dd3333",
            "icon": "wm-icon-trail",
            "showByDefault": false,
            "type": "line_geojson",
            "alert": false,
            "languages": {
                "it": "A piedi in città",
                "en": "Urban trekking"
            }
        },
        {
            "id": 12,
            "geojsonUrl": "tracks_12.geojson",
            "label": "Cicloescursionismo",
            "color": "#FF3812",
            "icon": "wm-icon-generic",
            "showByDefault": true,
            "type": "line_geojson",
            "alert": false,
            "languages": {
                "it": "Cicloescursionismo",
                "en": "Mountain bike"
            }
        },
        {
            "id": 13,
            "geojsonUrl": "tracks_13.geojson",
            "label": "Escursionismo",
            "color": "#FF3812",
            "icon": "wm-icon-generic",
            "showByDefault": true,
            "type": "line_geojson",
            "alert": false,
            "languages": {
                "it": "Escursionismo",
                "en": "Hiking"
            }
        }
    ],
    "OFFLINE": {
        "resourceBaseUrl": "http://pisatest.j.webmapp.it/geojson/",
        "pagesUrl": "http://pisatest.j.webmapp.it/pages/",
        "urlMbtiles": "http://pisatest.j.webmapp.it/tiles/map.mbtiles",
        "urlImages": "http://pisatest.j.webmapp.it/media/images.zip"
    },
    "LANGUAGES": {
        "actual": "it",
        "available": [
            "it",
            "en"
        ]
    },
    "REPORT": {
        "email": {
            "apiUrl": "https://api.webmapp.it/services/share.php",
            "default": "alessiopiccioli@webmapp.it"
        },
        "sms": {
            "default": "+39 328 5360803"
        }
    },
    "NAVIGATION": {
        "enableTrackRecording": true,
        "enableExportRecordedTrack": true
    },
    "INCLUDE": {
        "url": "/config.json"
    },
    "USER_COMMUNICATION": {
        "REPORT": {
            "items": [
                {
                    "title": "Danno ambientale",
                    "excerpt": "alberi caduti, strade dissestate, tombini rotti, cestini esplosi e bruciati",
                    "type": "reportTicket",
                    "fields": [
                        {
                            "label": "Descrizione",
                            "name": "description",
                            "mandatory": false,
                            "type": "textarea",
                            "help": "Inserisci la descrizione del problema che stai segnalando e.g. C'è un albero caduto in mezzo alla strada"
                        },
                        {
                            "label": "Foto",
                            "name": "picture",
                            "mandatory": true,
                            "type": "picture",
                            "help": "Scatta una foto che dimostri il problema e.g. una foto dell'albero caduto in mezzo alla strada"
                        }
                    ]
                },
                {
                    "title": "Presenza amianto",
                    "excerpt": "in caso di avvistamento di amianto",
                    "type": "reportTicket",
                    "fields": [
                        {
                            "label": "Titolo",
                            "name": "title",
                            "mandatory": true,
                            "type": "text",
                            "help": "Inserisci la descrizione del problema che stai segnalando e.g. C'è un albero caduto in mezzo alla strada",
                            "placeholder": "Titolo"
                        },
                        {
                            "label": "Descrizione",
                            "name": "description",
                            "mandatory": true,
                            "type": "textarea",
                            "help": "Inserisci la descrizione del problema che stai segnalando e.g. C'è un pannello di amianto appoggiato alla finestra",
                            "placeholder": "C'è un pannello di amianto appoggiato alla finestra"
                        },
                        {
                            "label": "Seleziona macchine",
                            "name": "drivencars",
                            "mandatory": true,
                            "type": "checkbox",
                            "help": "Seleziona le macchine che hai guidato",
                            "options": {
                                "1": "Fiat Panda (vecchia)",
                                "2": "Fiat Panda (nuova)",
                                "3": "Audi A8",
                                "4": "Tesla Model S",
                                "5": "Altro"
                            }
                        },
                        {
                            "label": "Seleziona una macchina che vuoi",
                            "name": "dreamcar",
                            "mandatory": true,
                            "type": "radio",
                            "help": "Seleziona una macchina che vorresti avere",
                            "options": {
                                "1": "Fiat Panda (vecchia)",
                                "2": "Fiat Panda (nuova)",
                                "3": "Audi A8",
                                "4": "Tesla Model S",
                                "5": "Altro"
                            }
                        },
                        {
                            "label": "Foto",
                            "name": "picture",
                            "mandatory": false,
                            "type": "picture",
                            "help": "Scatta una foto che dimostri il problema e.g. una foto del pannello di amianto"
                        }
                    ]
                }
            ]
        },
        "HELP": {
            "email": {
                "apiUrl": "https://api.webmapp.it/services/share.php",
                "default": "alessiopiccioli@webmapp.it"
            },
            "sms": {
                "default": "+39 328 5360803"
            }
        }
    }
};
