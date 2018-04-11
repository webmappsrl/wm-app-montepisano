angular.module('webmapp')

    .controller('PopupOpenerController', function PopupOpenerController(
        $state,
        MapService,
        Utils
    ) {
        var id = $state.params.id;
        var zoom = $state.params.zoom;
        setTimeout(function () {
            var features = MapService.getFeatureIdMap();

            if (features[id]) {
                MapService.centerOnFeature(features[id]);
                if (zoom) {
                    MapService.setZoom(zoom);
                }

                MapService.triggerFeatureClick(id);
            }
        }, 50);
        Utils.goTo('/');

        return {};
    });