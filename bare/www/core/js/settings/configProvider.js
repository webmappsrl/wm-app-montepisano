/*global angular*/
angular.module('webmapp')

.provider('CONFIG', function(
    GENERAL_CONFIG
    ) {
    var config = angular.extend(this, GENERAL_CONFIG);

    if (!!localStorage.$wm_mhildConf) {
        this.MAIN = GENERAL_CONFIG;
        config = angular.extend(this, JSON.parse(localStorage.$wm_mhildConf));
    }

    var getAsyncJSON = function(url) {
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
            .success(function(data) {
                retValue = data;
            })
            .error(function(error) {
                retValue = "ERROR";
            });

        return retValue;
    };
        

    this.$get = function(
        $ionicPopup,
        $ionicPlatform,
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

        if (config.INCLUDE) {
            var errors = 0;
                warnings = 0;

        //     if (config.INCLUDE.url) {
        //         var url = config.COMMUNICATION.baseUrl + config.INCLUDE.url;
        //         var data = getAsyncJSON(url);

        //         if (data === "ERROR") {
        //             var value = localStorage.getItem(url);
        //             if (value) {
        //                 var tmp = {};
        //                 tmp[i] = JSON.parse(value);
        //                 config = angular.extend(config, tmp);

        //                 warnings++;
        //             }
        //             else {
        //                 errors++;
        //             }
        //         }
        //         else {
        //             config = angular.extend(config, data);
        //             localStorage.setItem(url, JSON.stringify(data));
        //         }
        //     }
        //     else {
        //         for (var i in config.INCLUDE) {
        //             var url = config.COMMUNICATION.baseUrl + config.INCLUDE[i];
        //             var data = getAsyncJSON(url);
        //             if (data === "ERROR") {
        //                 var value = localStorage.getItem(url);
        //                 if (value) {
        //                     var tmp = {};
        //                     tmp[i] = JSON.parse(value);
        //                     config = angular.extend(config, tmp);
    
        //                     warnings++;
        //                 }
        //                 else {
        //                     errors++;
        //                 }
        //             }
        //             else {
        //                 var tmp = {};
        //                 tmp[i] = data;
        //                 config = angular.extend(config, tmp);
        //                 localStorage.setItem(url, JSON.stringify(data));
        //             }
        //         }
        //     }

            if (errors > 0) {
                $ionicPopup.alert({
                    title: $translate.instant("ATTENZIONE"),
                    template: $translate.instant("Si è verificato un errore di comunicazione che non permette il corretto caricamento dell'APP. Controlla di essere online e riprova più tardi"),
                    buttons: [{
                        text: 'Ok',
                        onTap: function (e) {
                            ionic.Platform.exitApp();
                        }
                    }]
                });
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



        console.log(config);

        return config;
    };
});