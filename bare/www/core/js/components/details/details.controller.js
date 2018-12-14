angular.module('webmapp')

    .controller('DetailController', function DetailController(
        $cordovaSocialSharing,
        $ionicLoading,
        $ionicModal,
        $ionicPopup,
        $ionicSlideBoxDelegate,
        $rootScope,
        $sce,
        $scope,
        $state,
        $translate,
        Auth,
        CONFIG,
        Communication,
        MapService,
        Model,
        Offline,
        Utils
    ) {
        var vm = {},
            current = $state.current || {},
            params = $state.params || {},
            fitView = {
                ready: false,
                centerOnPoint: false
            };

        var modalScope = $rootScope.$new(),
            modal = {},
            modalImage = {},
            modalText = {},
            modalEvent = {},
            modalTable = {},
            modalCoupons = {},
            modalFeatures = {},
            modalAccessibility = {};

        var registeredEvents = [];

        var isBrowser = vm.isBrowser = Utils.isBrowser();

        var extras = [];

        var trackRecordingEnabled = !Utils.isBrowser() && CONFIG.NAVIGATION && CONFIG.NAVIGATION.enableTrackRecording;

        modalScope.vm = {};
        modalScope.parent = vm;

        vm.avoidModal = CONFIG.OPTIONS.avoidModalInDetails;
        vm.colors = CONFIG.MAIN ? CONFIG.MAIN.STYLE : CONFIG.STYLE;
        vm.imageUrl = CONFIG.OFFLINE.imagesUrl;
        vm.isEventDetail = current.name === 'app.main.detailevent';
        vm.isFormationDetail = current.name === 'app.main.detailulayer';
        vm.openInAppBrowser = Utils.openInAppBrowser;
        vm.openInExternalBrowser = Utils.openInExternalBrowser;
        vm.additionalLinks = {};
        vm.isNavigable = false;
        vm.fullDescription = false;
        vm.showAccessibilityButtons = CONFIG.OPTIONS.showAccessibilityButtons;
        vm.useLogin = CONFIG.LOGIN && CONFIG.LOGIN.useLogin;
        vm.isLoggedIn = Auth.isLoggedIn();

        vm.hideSubMenu = true;

        vm.goBack = function () {
            if (vm.isMapExpanded) {
                vm.toggleMap();
            } else {
                if (vm.isNavigable) {
                    vm.isNavigable = false;
                    $rootScope.isNavigable = false;
                    $rootScope.$emit('item-navigable', vm.isNavigable);
                }

                if ($state.params.parentId) {
                    MapService.setFilter($state.params.parentId.replace(/_/g, " "), true);
                    if (vm.geometry && vm.geometry.type && (vm.geometry.type === "LineString" || vm.geometry.type === "MultiLineString")) {
                        $rootScope.highlightTrack = {
                            id: $state.params.id,
                            parentId: $state.params.parentId
                        };
                    }
                }

                Utils.goBack();
            }
        }

        MapService.resetUtfGridLayers();

        $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/tableModal.html', {
            scope: modalScope,
            animation: 'slide-in-up'
        }).then(function (modalObj) {
            modalTable = modalObj;
        });

        $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/featureListModal.html', {
            scope: modalScope,
            animation: 'slide-in-up'
        }).then(function (modalObj) {
            modalFeatures = modalObj;
        });

        $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/eventListModal.html', {
            scope: modalScope,
            animation: 'slide-in-up'
        }).then(function (modalObj) {
            modalEvent = modalObj;
        });

        $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/imagesModal.html', {
            scope: modalScope,
            animation: 'slide-in-up'
        }).then(function (modalObj) {
            modalImage = modalObj;
        });

        $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/textModal.html', {
            scope: modalScope,
            animation: 'slide-in-up'
        }).then(function (modalObj) {
            modalText = modalObj;
        });

        $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/couponsModal.html', {
            scope: modalScope,
            animation: 'slide-in-up'
        }).then(function (modalObj) {
            modalCoupons = modalObj;
        });

        $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/detailModal.html', {
            scope: modalScope,
            animation: 'slide-in-up'
        }).then(function (modalObj) {
            modal = modalObj;
        });

        $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/accessibilityModal.html', {
            scope: modalScope,
            animation: 'slide-in-up'
        }).then(function (modalObj) {
            modalAccessibility = modalObj;
        });

        function fitDataInView(data) {
            var node = document.getElementById("elevation-control-container");
            if (node) {
                MapService.centerOnFeature(data);
                MapService.toggleElevationControl(data, node);
                vm.fitRefresh = 0;
                var refresh = function () {
                    MapService.centerOnFeature(data);
                    if (vm.fitRefresh <= 15) {
                        vm.fitRefresh++;
                        setTimeout(refresh, 100);
                    }
                };
                refresh();
            }
            else {
                setTimeout(function () {
                    fitDataInView(data);
                }, 100);
            }
        };

        if (trackRecordingEnabled) {
            vm.isNavigating = $rootScope.isNavigating;
            var saveModalScope = $rootScope.$new();
            var saveModal = {};

            saveModalScope.vm = {};
            saveModalScope.vm.operation = 'salva';
            saveModalScope.vm.COLORS = vm.colors;
            saveModalScope.vm.inputError = false;
            saveModalScope.vm.errorMessage = "";

            $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/saveRecordModal.html', {
                scope: saveModalScope,
                animation: 'slide-in-up',
                hardwareBackButtonClose: false,
                backdropClickToClose: false
            }).then(function (modalObj) {
                saveModal = modalObj;
            });

            saveModalScope.vm.hide = function () {
                saveModal.hide();
            };
            saveModalScope.vm.title = "";
            saveModalScope.vm.description = "";

            saveModalScope.submitData = function () {
                var title = saveModalScope.vm.title;
                title = title.trim();
                var description = saveModalScope.vm.description.trim();
                if (title === "") {
                    saveModalScope.vm.errorMessage = "Compila tutti i campi richiesti";
                    saveModalScope.vm.inputError = true;
                } else {
                    MapService.editUserTrack(saveModalScope.vm.featureId, title, description).then(function () {
                        MapService.getFeatureById(saveModalScope.vm.featureId, "I miei percorsi").then(function (feature) {
                            buildDetail(feature);
                            Utils.forceDigest();
                        }, function () {
                            console.warn("No such feature");
                            Utils.goBack();
                        });

                    }).catch(function (err) {
                        console.warn("Impossible to save the new feature");
                        Utils.goBack();
                    });

                    saveModal.hide();
                }
            };

            vm.deleteTrack = function () {
                if (params.id) {
                    var id = params.id;
                    $ionicPopup.confirm({
                        title: $translate.instant("ATTENZIONE"),
                        template: $translate.instant("Stai per rimuovere il percorso dal dispositivo, vuoi procedere?"),
                    }).then(function (res) {
                        if (res) {
                            MapService.deleteUserTrack(id);
                            $rootScope.$emit('item-navigable', false);
                            $rootScope.isNavigable = false;
                            Utils.goTo('/');
                        }
                    })
                }
            };

            vm.shareTrack = function () {
                MapService.getUserTrackGeoJSON(params.id).then(
                    function (data) {
                        $cordovaSocialSharing
                            .share(
                                data,
                                "traccia geojson")
                            .then(function (result) {
                                // Success!
                            }, function (err) {
                                console.err(err);
                            });
                    }).catch(function (err) {
                        console.log(err);
                    });
            };

            vm.exportTrack = function () {
                $scope.data = {
                    email: ""
                };

                if (vm.isLoggedIn) {
                    $scope.data.email = Auth.getUserData().user_email;
                }

                var showPopup = function () {
                    var popup = $ionicPopup.show({
                        template: '<input type="text" ng-model="data.email" placeholder="email">',
                        title: $translate.instant('ATTENZIONE'),
                        subTitle: $translate.instant("Di seguito specifica l'indirizzo email al quale inviare il percorso"),
                        scope: $scope,
                        buttons: [
                            { text: 'Cancel' },
                            {
                                text: $translate.instant('INVIA'),
                                type: 'button-positive',
                                onTap: function (e) {
                                    return $scope.data.email;
                                }
                            }
                        ]
                    })
                    popup.then(function (res) {
                        if (res) {
                            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                            if (!re.test(res)) {
                                $ionicPopup.alert({
                                    title: $translate.instant('ATTENZIONE'),
                                    subTitle: $translate.instant("Inserisci un'email valida per continuare")
                                }).then(function () {
                                    $scope.data.email = res;
                                    vm.exportTrack();
                                });
                            }
                            else {
                                MapService.setItemInLocalStorage("$wm_export_email", res);
                                MapService.getUserTrackGeoJSON(params.id).then(function (geojson) {
                                    var url = 'https://api.webmapp.it/services/share.php';

                                    var app = CONFIG.OPTIONS.title;
                                    if (CONFIG.MAIN) {
                                        app = CONFIG.MAIN.OPTIONS.title + " - " + app;
                                    }

                                    $ionicLoading.show({
                                        template: '<ion-spinner></ion-spinner>'
                                    });

                                    var currentRequest = Communication.callAPI(url, {
                                        to: res,
                                        type: "export",
                                        geojson: JSON.stringify(geojson),
                                        app: app
                                    });

                                    currentRequest
                                        .then(function (data) {
                                            $ionicPopup.alert({
                                                title: $translate.instant("ATTENZIONE"),
                                                template: $translate.instant("Traccia esportata con successo")
                                            });
                                            $ionicLoading.hide();
                                            return;
                                        }).catch(function (error) {
                                            $ionicPopup.alert({
                                                title: $translate.instant("ATTENZIONE"),
                                                template: $translate.instant("Si è verificato un errore, riprova")
                                            });
                                            $ionicLoading.hide();
                                            return;
                                        });
                                }).catch(function (err) {
                                    console.warn(err);
                                });
                            }
                        }
                    });
                }

                MapService.getItemFromLocalStorage("$wm_export_email").then(function (data) {
                    if (data.data) {
                        $scope.data.email = data.data;
                    }
                    showPopup();
                }).catch(function () {
                    showPopup();
                });


            };

            vm.editTrack = function () {
                saveModalScope.vm.title = "";
                saveModalScope.vm.description = "";
                saveModalScope.vm.operation = "modifica";
                saveModalScope.vm.featureId = "";
                saveModalScope.vm.errorMessage = "";
                saveModalScope.vm.inputError = false;

                MapService.getFeatureById(params.id, "I miei percorsi").then(function (feature) {
                    saveModalScope.vm.title = feature.properties.name;
                    saveModalScope.vm.description = feature.properties.description;
                    saveModalScope.vm.operation = "modifica";
                    saveModalScope.vm.featureId = feature.properties.id;
                    saveModal.show();
                    console.log(feature);
                }).catch(function (err) {
                    console.log("No feature with such id", err);
                })
            };
        }

        var buildDetail = function (data) {
            var parent = data ? angular.copy(data.parent) : undefined,
                _feature = data ? angular.copy(data.properties) : {},
                feature = angular.copy(_feature);

            var mappingKey = parent.mapping || 'default',
                mapping = CONFIG.DETAIL_MAPPING[mappingKey],
                mappingTable = mapping ? mapping.table : {},
                mappingUrls = mapping ? mapping.urls : {},
                mappingFields = mapping ? mapping.fields : {},
                phoneMatch;

            var track = undefined;

            if ($rootScope.track) {
                track = angular.copy($rootScope.track);
                delete $rootScope.track;
            }

            vm.hasTable = false;
            vm.detailTable = {};

            if (typeof mappingTable !== 'undefined') {
                for (var i in mappingTable) {
                    if (typeof _feature[i] !== 'undefined' &&
                        _feature[i] !== null &&
                        _feature[i] !== "") {
                        vm.hasTable = true;
                        vm.detailTable[i] = mappingTable[i];
                    }
                }
                vm.featureDetails = _feature;
            }

            if (typeof mappingUrls !== 'undefined') {
                for (var u in mappingUrls) {
                    if (typeof _feature[u] !== 'undefined' &&
                        _feature[u] !== null) {
                        vm.additionalLinks[mappingUrls[u]] = _feature[u];
                    }
                }
            }

            if (data.geometry) {
                $rootScope.detailCoordinates = data.geometry.coordinates;
            } else {
                $rootScope.detailCoordinates = null;
            }

            if (typeof mappingFields !== 'undefined') {
                for (var f in mappingFields) {
                    feature[f] = _feature[mappingFields[f]];
                }
            }

            vm.onlyTable = vm.hasTable && !feature.description && !feature.image;

            if (feature && parent) {
                vm.mainTitle = feature.title || feature.name;
                vm.mainCategory = parent.label;
                vm.isParentInMenu = Model.isLayerInMenu(vm.mainCategory)

                vm.imageGallery = [];

                for (var g in feature.imageGallery) {
                    //vm.imageGallery.push(feature.imageGallery[g].src);
                    vm.imageGallery.push({
                        src: Offline.getRealImageUrl(feature.imageGallery[g].src),
                        caption: feature.imageGallery[g].caption ? feature.imageGallery[g].caption : ""
                    });
                }

                vm.hasGallery = vm.imageGallery.length > 0;

                if (feature.stats) {
                    var formatTime = function (time) {
                        if (!time) {
                            return "0min";
                        }

                        var hours = 0,
                            minutes = 0,
                            seconds = 0;

                        time = (time - (time % 1000)) / 1000;
                        seconds = time % 60;
                        minutes = ((time - seconds) / 60) % 60;
                        hours = ((time - seconds - minutes * 60) / 3600) % 24;

                        if (seconds > 29) {
                            minutes++;
                        }

                        if (hours > 0) {
                            return hours + 'h ' + minutes + 'min';
                        } else {
                            if (minutes > 0) {
                                return minutes + 'min';
                            }
                            else {
                                return '1min'
                            }
                        }
                    };

                    var formatDistance = function (distance) {
                        return distance ? ((distance / 1000).toFixed(1).replace(".", ",") + 'km') : '0km';
                    };

                    var formatSpeed = function (speed) {
                        return speed ? (speed.toFixed(0) + "km/h") : '0km/h';
                    };

                    var content = '<div class="details_stats-container">';
                    content += '<div class="details_stat">';
                    content += '<i class="wm-icon-android-clock"></i>';
                    content += '<span>' + formatTime(feature.stats.time) + '</span>';
                    content += '</div>';
                    content += '<div class="details_stat">';
                    content += '<i class="wm-icon-arrow-right-c"></i>';
                    content += '<span>' + formatDistance(feature.stats.distance) + '</span>';
                    content += '</div>';
                    content += '<div class="details_stat">';
                    content += '<i class="wm-icon-speedometer"></i>';
                    content += '<span>' + formatSpeed(feature.stats.averageSpeed) + '</span>';
                    content += '</div>';
                    content += '</div>';

                    if (feature.description) {
                        feature.description = content + feature.description;
                    }
                    else {
                        feature.description = content;
                    }

                }

                if (feature.description) {
                    var expandable = false;
                    if (feature.description.length > 200) {
                        expandable = true;
                    }
                    feature.description = feature.description.replace(new RegExp(/src="\//g), 'src="' + CONFIG.COMMUNICATION.baseUrl);
                    // feature.description = feature.description.replace(new RegExp(/href="([^\'\"]+)"/g), '');
                    // feature.description = feature.description.replace(new RegExp(/href="\//g), 'href="' + CONFIG.COMMUNICATION.baseUrl);
                    if (!Utils.isBrowser()) {
                        feature.description = feature.description.replace(new RegExp(/href="([^\'\"]+)"/g), 'onclick="window.open(\'$1\', \'_system\', \'\')"');
                    }
                    else {
                        // href="http(s)?:\/\/([^\'\"]+)(\.gpx|\.kml|\.geojson)" match WITH extension
                        feature.description = feature.description.replace(new RegExp(/href="http(s)?:\/\/([^\'\"]+)"/g), function (val, g0, g1) {
                            var re = /\.(gpx|kml|geojson)"/;
                            if (!g0) {
                                g0 = '';
                            }
                            if (re.test(val)) {
                                return 'href="https://api.webmapp.it/services/downloadResource.php?url=' + g1 + '" target="_self"';
                            }
                            else {
                                return 'onclick="window.open(\'http' + g0 + '://' + g1 + '\', \'_system\', \'\')"';
                            }
                        });
                    }
                    // feature.description = feature.description.replace(new RegExp(/window.open\(\'#\', \'_system\', \'\'\)/g), '');

                    vm.mainDescription = Utils.trimHtml(feature.description, {
                        limit: 120
                    });

                    vm.mainDescription.html = $sce.trustAsHtml(vm.mainDescription.html);

                    feature.description = $sce.trustAsHtml(feature.description);
                    feature.description.expandable = expandable;
                }

                if (feature.phone) {
                    var regExp = /\+(\d{2,4})\s+(\d{2,5}\s\d+)/g;
                    phoneMatch = regExp.exec(feature.phone);

                    if (phoneMatch) {
                        var localPhone = phoneMatch[2].replace(/\s/g, '');
                        vm.availablePhoneNumber = phoneMatch[1] + '-' + localPhone.replace(/(\d\d\d)(\d\d\d)(\d\d\d)/, '$1-$2-$3');
                    }
                }

                vm.chiama = function (number) {
                    window.plugins.CallNumber.callNumber(function () {
                        console.log('successo');
                    },
                        function () {
                            console.error('error');
                        }, number);
                };

                if (feature.image) {
                    feature.image = Offline.getRealImageUrl(feature.image);
                }

                if (typeof feature.events === 'object' &&
                    feature.events !== null) {
                    vm.relatedEvents = [];
                    for (var z in feature.events) {
                        MapService.getEventById(feature.events[z])
                            .then(function (evt) {
                                var event = angular.extend({}, evt);
                                vm.relatedEvents.push(event);
                            });
                    }
                }

                if (typeof feature.coupons === 'object' &&
                    feature.coupons !== null) {
                    vm.relatedCoupons = [];
                    for (var o in feature.coupons) {
                        MapService.getCouponById(feature.coupons[o])
                            .then(function (evt) {
                                var coupon = angular.extend({}, evt);
                                vm.relatedCoupons.push(coupon);
                            });
                    }
                }

                if (typeof feature.stages === 'object' &&
                    feature.stages !== null) {
                    vm.stages = [];
                    for (var s in feature.stages) {
                        vm.stages[s] = angular.extend({}, feature.stages[s]);
                        vm.stages[s].pois = [];
                        for (var p in feature.stages[s].pois) {
                            MapService.getFeatureById(feature.stages[s].pois[p])
                                .then($.proxy(function (data) {
                                    vm.stages[this.s].pois.push(data);
                                    extras.push(data);
                                }, {
                                        s: s
                                    }));
                        }
                    }
                }

                if (data.geometry.type === 'LineString' && feature.id_pois && feature.id_pois.length) {
                    if (!(CONFIG.OPTIONS.hideRelatedPoiInDetails || (CONFIG.MAIN && CONFIG.MAIN.OPTIONS.hideRelatedPoiInDetails && typeof CONFIG.OPTIONS.hideRelatedPoiInDetails == 'undefined'))) {
                        vm.related = MapService.getRelatedFeaturesById(feature.id_pois);
                        $rootScope.track = data;
                        track = undefined;
                    } else if (feature.description && feature.description.expandable) {
                        feature.description.expandable = false;
                    }
                } else {
                    if (feature.description && feature.description.expandable) {
                        feature.description.expandable = false;
                    }
                }

                vm.relatedItinerary = MapService.getItineraryRefByFeatureIdMap()[feature.id] || [];
                vm.feature = feature;
                vm.geometry = data.geometry;
                vm.coordinates = data.geometry.coordinates.toString();

                if (vm.geometry.type === "LineString") {
                    vm.isNavigable = true;
                    $rootScope.isNavigable = true;
                    $rootScope.$emit('item-navigable', vm.isNavigable);
                }

                vm.printUrl = function (url) {
                    url = url.replace(/http[s]?:\/\//g, "");
                    return url;
                };

                vm.contactCount = 0;
                if (vm.feature.email) {
                    vm.contactCount++;
                }
                if (vm.feature.phone) {
                    vm.contactCount++;
                }

                if (!CONFIG.OPTIONS.activateEditLink) {
                    vm.feature.wp_edit = "";
                }

                if (vm.feature.related_url) {
                    vm.contactCount++;

                    switch (vm.contactCount) {
                        case 1:
                            if (vm.feature.wp_edit) {
                                vm.relatedUrlLeftValue = 37;
                            }
                            else {
                                vm.relatedUrlLeftValue = 45;
                            }
                            break;
                        case 2:
                            if (vm.feature.wp_edit) {
                                vm.relatedUrlLeftValue = 58;
                            }
                            else {
                                vm.relatedUrlLeftValue = 69;
                            }
                            break;
                        case 3:
                            if (vm.feature.wp_edit) {
                                vm.relatedUrlLeftValue = 67;
                            }
                            else {
                                vm.relatedUrlLeftValue = 77;
                            }
                            break;
                        default:
                            break;
                    }
                }

                if (CONFIG.routeID && feature.routeID && CONFIG.routeID !== feature.routeID) {
                    vm.isEditable = false;
                }
                else {
                    vm.isEditable = true;
                }
                if (CONFIG.NAVIGATION && CONFIG.NAVIGATION.enableExportRecordedTrack) {
                    vm.isExportable = true;
                }
                else {
                    vm.isExportable = false;
                }
            }

            var objData = {
                'detail': [data]
            };

            if (vm.related) {
                var array = angular.copy(vm.related);
                array.push(data);

                objData['detail'] = array;
            }

            if (track) {
                objData['detail'] = [track, data];
                fitView.centerOnPoint = true;
            }

            if (extras.length > 0) {
                objData.extras = extras;
            }

            MapService.addFeaturesToFilteredLayer(objData, true, 200);

            if (fitView.ready) {
                fitDataInView(data);
            }
            else {
                fitView.ready = true;
                fitView.data = data;
            }

            if (vm.feature.accessibility) {
                vm.feature.accessibility.mobility.icon = 'wm-icon-wheelchair-15';
                vm.feature.accessibility.hearing.icon = 'wm-icon-hearing-impared';
                vm.feature.accessibility.vision.icon = 'wm-icon-visually-impaired';
                vm.feature.accessibility.cognitive.icon = 'wm-icon-cognitive-impared';
                vm.feature.accessibility.food.icon = 'wm-icon-food-intolerance';

                for (var i in vm.feature.accessibility) {
                    if (!vm.feature.accessibility[i].description || vm.feature.accessibility[i].description === "") {
                        vm.feature.accessibility[i].description = "Questa descrizione non è ancora stata inserita e sarà disponibile a breve.";
                    }
                }
            }

            // console.log(feature, vm)
        };

        modalScope.vm.openFeature = function (feature) {
            Utils.goTo('layer/' + feature.parent.label.replace(/ /g, '_') + '/' + feature.properties.id);
        };

        modalScope.vm.openEvent = function (event) {
            Utils.goTo('detailevent/' + event.id);
        };

        modalScope.vm.nextImage = function () {
            if ($ionicSlideBoxDelegate._instances &&
                $ionicSlideBoxDelegate._instances.length > 0) {
                $ionicSlideBoxDelegate._instances[$ionicSlideBoxDelegate._instances.length - 1].next();
            }
        };

        modalScope.vm.prevImage = function () {
            if ($ionicSlideBoxDelegate._instances &&
                $ionicSlideBoxDelegate._instances.length > 0) {
                $ionicSlideBoxDelegate._instances[$ionicSlideBoxDelegate._instances.length - 1].previous();
            }
        };

        modalScope.vm.hide = function () {
            modal && modal.hide();
            modalImage && modalImage.hide();
            modalText && modalText.hide();
            modalEvent && modalEvent.hide();
            modalTable && modalTable.hide();
            modalCoupons && modalCoupons.hide();
            modalFeatures && modalFeatures.hide();
            modalAccessibility && modalAccessibility.hide();
        };

        if (current.name === 'app.main.detaillayer') {
            MapService.getFeatureById(params.id, params.parentId.replace(/_/g, ' '))
                .then(buildDetail, function () {
                    console.error('Retrive feature error');
                    // TODO: go to the start url
                    Utils.goTo('map');
                });
        } else if (current.name === 'app.main.detailulayer') {
            vm.isAreaDetail = true;
            MapService.getAreaById(params.id)
                .then(function (data) {
                    buildDetail(data);
                    setTimeout(function () {
                        if (data.properties && data.properties.BBOX) {
                            MapService.fitBoundsFromString(data.properties.BBOX);
                        }
                    }, 1000);
                }, function () {
                    console.error('Area not found');
                    // TODO: go to the start url
                    Utils.goTo('map');
                });
        } else if (current.name === 'app.main.detailevent') {
            MapService.getEventById(params.id)
                .then(function (evt) {
                    var event = angular.extend({}, evt);

                    vm.mainTitle = event.title;

                    // TODO: make it generalized with feature
                    if (event.body) {
                        event.body = event.body.replace(new RegExp(/src="\//g), 'src="' + CONFIG.COMMUNICATION.baseUrl);
                        event.body = event.body.replace(new RegExp(/href="([^\'\"]+)"/g), '');
                        // event.body = event.body.replace(new RegExp(/href="\//g), 'href="' + CONFIG.COMMUNICATION.baseUrl);
                        // event.body = event.body.replace(new RegExp(/href="([^\'\"]+)"/g), 'href="" onclick="window.open(\'$1\', \'_system\', \'\')"');
                        // event.body = event.body.replace(new RegExp(/window.open\(\'#\', \'_system\', \'\'\)/g), '');

                        vm.mainDescription = Utils.trimHtml(event.body, {
                            limit: 120
                        });

                        vm.mainDescription.html = $sce.trustAsHtml(vm.mainDescription.html);
                        event.body = $sce.trustAsHtml(event.body);
                    }

                    vm.feature = event;
                    vm.feature.img = event.field_image;
                    vm.relatedPlaces = [];

                    for (var i in event.pois) {
                        MapService.getFeatureById(event.pois[i])
                            .then(function (data) {
                                vm.relatedPlaces.push(data);
                            });
                    }

                    setTimeout(function () {
                        MapService.addFeaturesToFilteredLayer({
                            'detail': vm.relatedPlaces
                        }, true);
                    }, 1000);
                }, function () {
                    console.error('Retrive feature error');
                    // TODO: go to the start url
                    Utils.goTo('map');
                });
        };

        vm.openLink = function (link) {
            if (link.substring(0, 4) !== 'http') {
                link = 'http://' + link;
            }

            if (isBrowser) {
                vm.openInAppBrowser(link);
            } else {
                vm.openInExternalBrowser(link);
            }
        };

        vm.showLeft = function () {
            if (!vm.hasGallery) {
                return false;
            }

            if ($ionicSlideBoxDelegate._instances &&
                $ionicSlideBoxDelegate._instances.length > 0) {
                return $ionicSlideBoxDelegate._instances[$ionicSlideBoxDelegate._instances.length - 1].currentIndex() !== 0;
            }
        };

        vm.showRight = function () {
            if (!vm.hasGallery) {
                return false;
            }

            if (vm.imageGallery.length === 0) {
                return false;
            }

            if ($ionicSlideBoxDelegate._instances &&
                $ionicSlideBoxDelegate._instances.length > 0) {
                return $ionicSlideBoxDelegate._instances[$ionicSlideBoxDelegate._instances.length - 1].currentIndex() !== vm.imageGallery.length - 1;
            }
        };

        vm.slideVisible = function (index) {
            if (index < $ionicSlideBoxDelegate.currentIndex() - 1 ||
                index > $ionicSlideBoxDelegate.currentIndex() + 1) {
                return false;
            }

            if (vm.imageGallery.length === 0) {
                return false;
            }

            return true;
        };

        vm.goBackToCategory = function (category) {
            Utils.goTo('layer/' + category.replace(/ /g, '_'));
        };

        vm.openRelatedUrlPopup = function () {
            if (typeof vm.feature.related_url === 'string') {
                vm.openLink(vm.feature.related_url);
            }
            else {
                vm.relatedUrlPopupOpened = !vm.relatedUrlPopupOpened;
                Utils.forceDigest();
            }
        };

        vm.openRelated = function (item) {
            Utils.goTo('layer/' + item.parent.label.replace(/ /g, '_') + '/' + item.properties.id);
        };

        vm.openRelatedPOI = function (stage) {
            if (stage.pois.length === 0) {
                return;
            }

            var featureById = MapService.getFeatureIdMap();

            modalScope.vm.featureList = [];
            modalScope.vm.featureTitle = $translate.instant("PUNTI DI INTERESSE");

            for (var i in stage.pois) {
                modalScope.vm.featureList.push(stage.pois[i]);
            }

            modalFeatures.show();
        };

        vm.openItineraryRelatedFeatures = function () {
            var featureById = MapService.getFeatureIdMap();

            modalScope.vm.featureList = [];
            modalScope.vm.featureTitle = $translate.instant("ITINERARI");

            for (var i in vm.relatedItinerary) {
                if (typeof featureById[vm.relatedItinerary[i]] !== 'undefined') {
                    modalScope.vm.featureList.push(featureById[vm.relatedItinerary[i]]);
                }
            }

            modalFeatures.show();
        };

        vm.openRelatedPlaces = function () {
            var featureById = MapService.getFeatureIdMap();

            modalScope.vm.featureList = [];
            modalScope.vm.featureTitle = $translate.instant("LUOGHI");

            for (var i in vm.relatedPlaces) {
                if (vm.relatedPlaces[i].properties &&
                    vm.relatedPlaces[i].properties.id &&
                    featureById[vm.relatedPlaces[i].properties.id] !== 'undefined') {
                    modalScope.vm.featureList.push(featureById[vm.relatedPlaces[i].properties.id]);
                }
            }

            modalFeatures.show();
        };

        vm.openRelatedEvents = function () {
            modalScope.vm.eventList = vm.relatedEvents;
            modalEvent.show();
        };

        vm.openImageModal = function () {
            if (vm.imageGallery.length > 1 || (vm.imageGallery.length === 1 && vm.imageGallery[0].caption && vm.imageGallery[0].caption !== "")) {
                modalImage.show();
            }
        };

        vm.openTextModal = function () {
            modalText.show();
        };

        vm.openTableModal = function () {
            modalTable.show();
        };

        vm.openCouponsModal = function () {
            modalCoupons.show();
        };

        vm.openModal = function () {
            modal.show();
        };

        vm.openAccessibilityModal = function (type) {
            modalScope.vm.accessibility = vm.feature.accessibility[type];
            modalAccessibility.show();
        };

        vm.toggleMap = function () {
            $rootScope.$emit('toggle-map-from-detail');
            // vm.isNavigable = false;
            // $rootScope.$emit('item-navigable', vm.isNavigable);
        };

        vm.renderDate = function (date) {
            var parsedDate,
                month, year;

            if (date) {
                parsedDate = new Date(Number(date) * 1000);
                year = String(parsedDate.getFullYear()).substr(2);
                month = parsedDate.getMonth() + 1;
                month = String(month).length === 1 ? '0' + month : month;
            }

            return month + '.' + year;
        };

        vm.openExternalMap = function () {
            var coordinates = $rootScope.detailCoordinates;

            if (coordinates) {
                if (Utils.isBrowser()) {
                    window.open('http://maps.google.com/?q=' + coordinates[1] + ',' + coordinates[0] + '', '_blank');
                } else {
                    launchnavigator.navigate([coordinates[1], coordinates[0]]);
                }
            }
        };

        var forceDigest = function () {
            setTimeout(function () {
                $(window).trigger('resize');
                Utils.forceDigest();
            }, 100);
        };

        vm.toggleDescription = function () {
            vm.fullDescription = !vm.fullDescription;
            forceDigest();
        };

        registeredEvents.push(
            $rootScope.$on('expand-map', function (e, value) {
                vm.isMapExpanded = value;
            })
        );

        registeredEvents.push(
            $scope.$on('$ionicView.afterEnter', function () {
                if (fitView.ready && fitView.data) {
                    fitDataInView(fitView.data);
                }
                else {
                    fitView.ready = true;
                }
            })
        );

        registeredEvents.push(
            $scope.$on('$destroy', function () {
                modal && modal.remove();
                modalImage && modalImage.remove();
                modalText && modalText.remove();
                modalEvent && modalEvent.remove();
                modalTable && modalTable.remove();
                modalCoupons && modalCoupons.remove();
                modalFeatures && modalFeatures.remove();

                if ($ionicSlideBoxDelegate._instances &&
                    $ionicSlideBoxDelegate._instances.length > 0) {
                    $ionicSlideBoxDelegate._instances[$ionicSlideBoxDelegate._instances.length - 1].kill();
                    $ionicSlideBoxDelegate.update();
                }

                for (var i in registeredEvents) {
                    registeredEvents[i]();
                }
                delete registeredEvents;
            })
        );

        document.addEventListener('deviceready', function () {
            isOnline = Connection && navigator.network.connection.type !== Connection.NONE;
        }, false);

        vm.toggleList = function () {
            vm.isListExpanded = !vm.isListExpanded;
            $rootScope.$emit('toggle-list', vm.isListExpanded);
        };

        return vm;
    });
