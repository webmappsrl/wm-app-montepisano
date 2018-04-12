angular.module('webmapp')

    .controller('PopupOpenerController', function PopupOpenerController(
        $ionicPlatform,
        $state,
        MapService,
        Utils
    ) {
        var id = $state.params.id;
        var zoom = $state.params.zoom;

        $ionicPlatform.ready(function () {
            var timerFunction = function () {
                if (MapService.isReady()) {
                    var features = MapService.getFeatureIdMap();

                    setTimeout(function () {
                        if (features[id]) {
                            MapService.centerOnFeature(features[id]);
                            if (zoom) {
                                setTimeout(function () {
                                    MapService.setZoom(zoom);
                                }, 100);
                            }

                            setTimeout(function () {
                                MapService.triggerFeatureClick(id);
                            }, 250);
                        }
                    }, 250);
                } else {
                    setTimeout(timerFunction, 300);
                }
            };

            timerFunction();

            MapService.resetView();
            Utils.goTo('/')
        });


        return {};
    });