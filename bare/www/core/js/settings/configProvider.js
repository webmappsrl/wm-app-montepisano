/*global angular*/
angular.module('webmapp')

    .provider('CONFIG', function (
    ) {
        var config = {};

        var GENERAL_CONFIG = {};

        var warnings = 0;

        function loadLocalConfigJson() {
            var xobj = new XMLHttpRequest(),
                url = "./config/config.json",
                isIos = window.cordova && window.cordova.platformId === 'ios';
            xobj.overrideMimeType("application/json");
            if (!window.cordova && window.location.hostname !== "localhost") {
                url = "./config.json";
            }
            xobj.open('GET', url, false);
            xobj.onreadystatechange = function () {
                if (xobj.readyState === 4 && ((isIos && +xobj.status === 0) || +xobj.status === 200)) {
                    GENERAL_CONFIG = JSON.parse(xobj.responseText);
                }
                else if (+xobj.status === 404) {
                    if (MOCK_CONFIG) {
                        GENERAL_CONFIG = MOCK_CONFIG;
                    }
                }
            };
            xobj.send(null);
        }

        function getSyncJSON(url) {
            var retValue;
            var options = {
                method: 'GET',
                url: url + "?ts=" + Date.now(),
                dataType: 'json',
                async: false
            };

            $.ajax(options)
                .success(function (data) {
                    retValue = data;
                })
                .error(function (error) {
                    retValue = "ERROR";
                });

            return retValue;
        };

        loadLocalConfigJson();
        config = angular.extend(this, GENERAL_CONFIG);

        if (!!localStorage.$wm_mhildConf) {
            this.MAIN = GENERAL_CONFIG;
            var version = config.VERSION;
            if (this.MAIN.INCLUDE && this.MAIN.INCLUDE.url) {
                var mainInclude = localStorage.getItem("$wm_config_json") ? JSON.parse(localStorage.getItem("$wm_config_json")) : {};
                this.MAIN = angular.extend(this.MAIN, mainInclude);
                this.MAIN.VERSION = version;
                // console.log(this.MAIN, mainInclude);
            }
            config = angular.extend(this, JSON.parse(localStorage.$wm_mhildConf));
            config.VERSION = version;
        }

        var mhildBaseUrl;

        if (!!localStorage.$wm_mhildBaseUrl) {
            mhildBaseUrl = localStorage.$wm_mhildBaseUrl;
            config.MAP.layers[0].tilesUrl = mhildBaseUrl + config.MAP.layers[0].tilesUrl;

            for (var i = 0; i < config.OVERLAY_LAYERS.length; i++) {
                config.OVERLAY_LAYERS[i].geojsonUrl = mhildBaseUrl + config.OVERLAY_LAYERS[i].geojsonUrl;
            }
        }

        if (config.INCLUDE && !config.MAIN) {
            var version = config.VERSION;

            if (config.INCLUDE.url) {
                var url = config.INCLUDE.url;
                if (url.substring(0, 4) !== "http") {
                    url = config.COMMUNICATION.baseUrl + url;
                }
                var data = getSyncJSON(url);

                if (data === "ERROR") {
                    var value = localStorage.getItem("$wm_config_json");
                    if (value) {
                        var tmp = {};
                        tmp[i] = JSON.parse(value);
                        config = angular.extend(config, tmp);
                    }
                    warnings++;
                } else {
                    config = angular.extend(config, data);
                    localStorage.setItem("$wm_config_json", JSON.stringify(data));
                }
            }

            config.VERSION = version;
        }

        if (window.cordova && (config.NAVIGATION && config.NAVIGATION.enableTrackRecording) || (config.MAIN && config.MAIN.NAVIGATION && config.MAIN.NAVIGATION.enableTrackRecording)) {
            config.OVERLAY_LAYERS.push({
                id: "userTracks",
                label: "I miei percorsi",
                color: "#FF3812",
                icon: "wm-icon-generic",
                showByDefault: true,
                type: "line_geojson"
            });
        }

        // console.log(config)

        this.$get = function (
            $ionicPopup,
            $translate
        ) {
            if (warnings > 0 && !localStorage.offlineMode && !localStorage.$wm_mhildConf) {
                $ionicPopup.alert({
                    title: $translate.instant("ATTENZIONE"),
                    template: $translate.instant("C'è stato un problema di comunicazione con il server: i dati potrebbero non essere aggiornati"),
                    buttons: [{
                        text: 'Ok',
                        type: 'button-positive'
                    }]
                });
            }

            return config;
        };
    });
