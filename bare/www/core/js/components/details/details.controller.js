angular.module('webmapp')

    .controller('DetailController', function DetailController(
        $ionicModal,
        $ionicSlideBoxDelegate,
        $rootScope,
        $sce,
        $scope,
        $state,
        $translate,
        CONFIG,
        MapService,
        Model,
        Offline,
        Search,
        Utils
    ) {
        var vm = {},
            current = $state.current || {},
            params = $state.params || {};

        var modalScope = $rootScope.$new(),
            modal = {},
            modalImage = {},
            modalText = {},
            modalEvent = {},
            modalTable = {},
            modalCoupons = {},
            modalFeatures = {};

        var isOnline = false,
            isBrowser = vm.isBrowser = Utils.isBrowser();

        var extras = [];

        modalScope.vm = {};
        modalScope.parent = vm;

        var selectedPoi = null;

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

        vm.hideSubMenu = true;

        var handlePoiHighlight = function (newPoi) {
            MapService.clearHighlightedPoi();
            if (newPoi !== null) {
                MapService.highlightPoi(newPoi);
            }
        };

        vm.goBack = function () {
            if (vm.isNavigable) {
                vm.isNavigable = false;
                $rootScope.$emit('item-navigable', vm.isNavigable);
            }

            if (vm.geometry.type === "LineString") {
                Utils.goTo('/'); //Should not enter here
            }
            else {
                ////gototrack
                Utils.goTo('layer/' + vm.track.parent.label.replace(/ /g, '_') + '/' + vm.track.properties.id);
            }
        }

        vm.goToSearch = function () {
            Search.setActiveAllLayers();

            Utils.goTo('search');
        };

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

        var buildDetail = function (data) {
            var parent = data ? angular.extend({}, data.parent) : undefined,
                _feature = data ? angular.extend({}, data.properties) : {},
                feature = angular.extend({}, _feature);

            var mappingKey = parent.mapping || 'default',
                mapping = CONFIG.DETAIL_MAPPING[mappingKey],
                mappingTable = mapping ? mapping.table : {},
                mappingUrls = mapping ? mapping.urls : {},
                mappingFields = mapping ? mapping.fields : {},
                phoneMatch;

            vm.track = null;

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
                    vm.imageGallery.push(Offline.getRealImageUrl(feature.imageGallery[g].src));
                }

                vm.hasGallery = vm.imageGallery.length > 0;

                if (feature.description) {
                    var expandable = false;
                    if (feature.description.length > 200) {
                        expandable = true;
                    }
                    feature.description = feature.description.replace(new RegExp(/src="\//g), 'src="' + CONFIG.COMMUNICATION.baseUrl);
                    // feature.description = feature.description.replace(new RegExp(/href="([^\'\"]+)"/g), '');
                    // feature.description = feature.description.replace(new RegExp(/href="\//g), 'href="' + CONFIG.COMMUNICATION.baseUrl);
                    feature.description = feature.description.replace(new RegExp(/href="([^\'\"]+)"/g), 'href="" onclick="window.open(\'$1\', \'_system\', \'\')"');
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
                    vm.related = MapService.getRelatedFeaturesById(feature.id_pois);
                } else {
                    //Find related track
                    vm.track = MapService.getRelatedTrackByFeatureId(feature.id);
                    if (vm.track && vm.track.properties.id_pois && vm.track.properties.id_pois.length) {
                        vm.related = MapService.getRelatedFeaturesById(vm.track.properties.id_pois);
                    }
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
                    $rootScope.$emit('item-navigable', vm.isNavigable);
                }
                $rootScope.$emit('taxonomy-details', {
                    name: vm.taxonomyName,
                    color: vm.itemColor,
                    icon: vm.activityIcon
                });
            }

            setTimeout(function () {
                var objData = {
                    'detail': [data]
                };
                var arrayOfRelatedPois = null;

                if (vm.related) {
                    for (var i in vm.related) {
                        if (vm.related[i].properties.image) {
                            vm.related[i].properties.image = Offline.getRealImageUrl(vm.related[i].properties.image);
                        }
                    }
                    var arrayOfRelatedPois = angular.copy(vm.related);
                    arrayOfRelatedPois.push(data);

                    objData['detail'] = arrayOfRelatedPois;
                }

                if (vm.track) {
                    if (arrayOfRelatedPois) {
                        arrayOfRelatedPois.push(vm.track);
                        objData['detail'] = arrayOfRelatedPois;
                    }
                    else {
                        objData['detail'] = [vm.track, data];
                    }
                }

                if (extras.length > 0) {
                    objData.extras = extras;
                }

                if (data.geometry.type === 'LineString') {
                    MapService.addFeaturesToFilteredLayer(objData, true);
                    selectedPoi = null;
                    handlePoiHighlight(selectedPoi);
                }
                else {
                    MapService.addFeaturesToFilteredLayer(objData, false);
                    MapService.centerOnCoords(data.geometry.coordinates[1], data.geometry.coordinates[0]);
                    selectedPoi = data;
                    handlePoiHighlight(selectedPoi);
                }

                console.log(vm)
                setTimeout(function () {
                    MapService.adjust();
                }, 1000);
            }, 100);

            // console.log(vm["feature"]);
            // vm.feature.description = "ciao <a href=\"http://www.google.com\">ciaociao</a> ciao";
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
        };

        vm.itemColor = localStorage.$wm_itemColor ? JSON.parse(localStorage.$wm_itemColor) : 'inherit';
        vm.taxonomyName = localStorage.$wm_taxonomyName ? JSON.parse(localStorage.$wm_taxonomyName) : '';
        vm.activityIcon = localStorage.$wm_activityIcon ? JSON.parse(localStorage.$wm_activityIcon) : 'wm-icon-generic';

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
            if (vm.imageGallery.length > 1) {
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

        vm.toggleMap = function () {
            $rootScope.$emit('toggle-map-from-detail');
            vm.isNavigable = false;
            $rootScope.$emit('item-navigable', vm.isNavigable);
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

        $rootScope.$on('expand-map', function (e, value) {
            vm.hideBack = value;
        });

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
                // delete $ionicSlideBoxDelegate._instances[0];
                // $ionicSlideBoxDelegate._instances[$ionicSlideBoxDelegate._instances.length - 1].kill();
                $ionicSlideBoxDelegate.update();
            }
        });

        var beforeLeaveHandler = $scope.$on('$ionicView.beforeLeave', function () {
            selectedPoi = null;
            handlePoiHighlight(selectedPoi);
            beforeLeaveHandler();
        });

        document.addEventListener('deviceready', function () {
            isOnline = Connection && navigator.network.connection.type !== Connection.NONE;
        }, false);

        vm.toggleList = function () {
            vm.isListExpanded = !vm.isListExpanded;
            $rootScope.$emit('toggle-list', vm.isListExpanded);
        };

        return vm;
    });
