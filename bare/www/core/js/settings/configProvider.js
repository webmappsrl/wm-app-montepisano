/*global angular*/
angular.module('webmapp')

.provider('CONFIG', function(GENERAL_CONFIG) {
    var config = angular.extend(this, GENERAL_CONFIG);

    if (!!localStorage.$wm_mhildConf) {
        this.MAIN = GENERAL_CONFIG;
        config = angular.extend(this, JSON.parse(localStorage.$wm_mhildConf));
    }

    this.$get = function() {
        var mhildBaseUrl;

        if (!!localStorage.$wm_mhildBaseUrl) {
            mhildBaseUrl = localStorage.$wm_mhildBaseUrl;
            console.log(mhildBaseUrl)
            config.MAP.layers[0].tilesUrl = mhildBaseUrl + config.MAP.layers[0].tilesUrl;

            for (var i = 0; i < config.OVERLAY_LAYERS.length; i++) {
                config.OVERLAY_LAYERS[i].geojsonUrl = mhildBaseUrl + config.OVERLAY_LAYERS[i].geojsonUrl;
            }
        }

        console.log(config);

        return config;
    };
});