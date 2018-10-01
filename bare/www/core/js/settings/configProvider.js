/*global angular*/
angular.module('webmapp')

    .provider('CONFIG', function (
        // GENERAL_CONFIG
    ) {
        var config = {};

        var GENERAL_CONFIG = {};

        // Load local config.json
        function loadConfigJson() {
            var xobj = new XMLHttpRequest(),
                url = "./config/config.json";
            xobj.overrideMimeType("application/json");
            if (!window.cordova && window.location.hostname !== "localhost") {
                url = "./config.json";
            }
            xobj.open('GET', url, false);
            xobj.onreadystatechange = function () {
                if (xobj.readyState == 4 && xobj.status == "200") {
                    GENERAL_CONFIG = JSON.parse(xobj.responseText);
                }
            };
            xobj.send(null);
        }

        loadConfigJson();
        config = angular.extend(this, GENERAL_CONFIG);

        if (!!localStorage.$wm_mhildConf) {
            this.MAIN = GENERAL_CONFIG;
            if (this.MAIN.INCLUDE && this.MAIN.INCLUDE.url) {
                var url = this.MAIN.INCLUDE.url;
                if (url.substring(0, 4) !== "http") {
                    url = this.MAIN.COMMUNICATION.baseUrl + url;
                }
                var mainInclude = localStorage.getItem(this.MAIN.INCLUDE.url) ? JSON.parse(localStorage.getItem(this.MAIN.INCLUDE.url)) : {};
                this.MAIN = angular.extend(this.MAIN, mainInclude);
                // console.log(this.MAIN, mainInclude);
            }
            config = angular.extend(this, JSON.parse(localStorage.$wm_mhildConf));
        }

        var getAsyncJSON = function (url) {
            var retValue;
            var options = {
                method: 'GET',
                url: url,
                dataType: 'json',
                // headers: {
                //     'Access-Control-Allow-Origin': '*'
                // },
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


        this.$get = function (
            $ionicPopup,
            $translate
        ) {
            var mhildBaseUrl;

            if (!!localStorage.$wm_mhildBaseUrl) {
                mhildBaseUrl = localStorage.$wm_mhildBaseUrl;
                config.MAP.layers[0].tilesUrl = mhildBaseUrl + config.MAP.layers[0].tilesUrl;

                for (var i = 0; i < config.OVERLAY_LAYERS.length; i++) {
                    config.OVERLAY_LAYERS[i].geojsonUrl = mhildBaseUrl + config.OVERLAY_LAYERS[i].geojsonUrl;
                }
            }

            if (config.INCLUDE && !config.MAIN) {
                var warnings = 0;

                if (config.INCLUDE.url) {
                    var url = config.INCLUDE.url;
                    if (url.substring(0, 4) !== "http") {
                        url = config.COMMUNICATION.baseUrl + url;
                    }
                    var data = getAsyncJSON(url);

                    if (data === "ERROR") {
                        var value = localStorage.getItem(url);
                        if (value) {
                            var tmp = {};
                            tmp[i] = JSON.parse(value);
                            config = angular.extend(config, tmp);
                        }
                        warnings++;
                    } else {
                        config = angular.extend(config, data);
                        localStorage.setItem(url, JSON.stringify(data));
                    }
                } else {
                    for (var i in config.INCLUDE) {
                        var url = config.COMMUNICATION.baseUrl + config.INCLUDE[i];
                        var data = getAsyncJSON(url);
                        if (data === "ERROR") {
                            var value = localStorage.getItem(url);
                            if (value) {
                                var tmp = {};
                                tmp[i] = JSON.parse(value);
                                config = angular.extend(config, tmp);
                            }
                            warnings++;
                        } else {
                            var tmp = {};
                            tmp[i] = data;
                            config = angular.extend(config, tmp);
                            localStorage.setItem(url, JSON.stringify(data));
                        }
                    }
                }

                if (warnings > 0) {
                    $ionicPopup.alert({
                        title: $translate.instant("ATTENZIONE"),
                        template: $translate.instant("C'è stato un problema di comunicazione con il server: i dati potrebbero non essere aggiornati"),
                        buttons: [{
                            text: 'Ok',
                            type: 'button-positive'
                        }]
                    });
                }
            }

            // console.log(config);
            if (window.cordova && config.NAVIGATION && config.NAVIGATION.enableTrackRecording) {
                config.OVERLAY_LAYERS.push({
                    id: "userTracks",
                    label: "I miei percorsi",
                    color: "#FF3812",
                    icon: "wm-icon-generic",
                    showByDefault: true,
                    type: "line_geojson"
                });
            }

            // console.log(config);
            return config;
        };

        return this.$get();
    });
