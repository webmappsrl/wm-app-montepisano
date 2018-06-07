angular.module('webmapp')

    .controller('PopupOpenerController', function PopupOpenerController(
        $ionicPlatform,
        $state,
        MapService,
        Utils
    ) {
        var id = $state.params.id,
            zoom = null;

        if ($state.params.zoom) {
            zoom = $state.params.zoom;
        }

        $ionicPlatform.ready(function () {
            setTimeout(function() {
                var timerFunction = function () {
                    if (MapService.isReady()) {
                        var features = MapService.getFeatureIdMap();
    
                        setTimeout(function () {
                            if (features[id]) {
                                MapService.centerOnFeature(features[id]);
                                MapService.setFilter(features[id].parent.label, true);
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
            }, 1000);
        });


        return {};
    });