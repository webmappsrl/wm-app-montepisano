angular.module('webmapp')

    .controller('MapController', function MapController(
        $ionicModal,
        $ionicPlatform,
        $rootScope,
        $scope,
        $translate,
        CONFIG,
        MapService,
        Utils
    ) {
        var vm = {};

        var modalScope = $rootScope.$new(),
            modal = {};

        var areAllActive = function (filtersMap) {
            var allActive = true;

            for (var i in filtersMap) {
                if (i !== $translate.instant("Tutte")) {
                    if (!filtersMap[i].value) {
                        allActive = false;
                        break;
                    }
                }
            }

            return allActive;
        };
        var trackRecordingEnabled = CONFIG.NAVIGATION && CONFIG.NAVIGATION.enableTrackRecording;

        MapService.showAllLayers();
        MapService.activateUtfGrid();
        modalScope.vm = {};
        modalScope.vm.isNewModal = CONFIG.MAP.filters;

        vm.mapTitle = CONFIG.OPTIONS.title;
        vm.filterIcon = trackRecordingEnabled ? "wm-icon-md-option-menu" : CONFIG.OPTIONS.filterIcon;
        vm.showFilers = !CONFIG.OPTIONS.hideFiltersInMap;
        vm.isNavigable = $rootScope.isNavigable ? $rootScope.isNavigable : false;
        vm.goBack = Utils.goBack;

        vm.colors = CONFIG.MAIN ? CONFIG.MAIN.STYLE : CONFIG.STYLE;

        vm.packages = localStorage.$wm_packages ? JSON.parse(localStorage.$wm_packages) : null;
        vm.id = CONFIG.routeID;
        var currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";

        if (vm.packages && vm.id) {
            for (var i in vm.packages) {
                if (vm.packages[i].id === vm.id) {
                    if (vm.packages[i].wpml_translations) {
                        for (var pos in vm.packages[i].wpml_translations) {
                            if (vm.packages[i].wpml_translations[pos].locale.substring(0, 2) === currentLang) {
                                vm.mapTitle = vm.packages[i].wpml_translations[pos].post_title;
                                break;
                            }
                        }
                    }
                    break;
                }
            }
        }

        vm.mapLayers = CONFIG.MAP.layers;

        if (vm.mapLayers.length > 1) {
            modalScope.vm.isMap = true;
        } else {
            modalScope.vm.isMap = false;
        }

        modalScope.vm.baseLayers = MapService.getBaseLayers();
        modalScope.vm.COLORS = vm.colors;

        $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/filtersModal.html', {
            scope: modalScope,
            animation: 'slide-in-up'
        }).then(function (modalObj) {
            modal = modalObj;
        });

        modalScope.vm.hide = function () {
            modal.hide();
            if (modalScope.vm.isNewModal) {
                var currentFilters = MapService.getActiveFilters();
                if (!angular.equals(currentFilters, vm.initialFilters)) {
                    // The delay is to prevent the map rendering while the modal is closing
                    setTimeout(function () {
                        var features = getFeaturesToDisplay();
                        MapService.addFeaturesToFilteredLayer(features);
                    }, 500);
                }
            }
        };

        modalScope.vm.updateFilter = function (filterName, value) {
            if (modalScope.vm.isNewModal) {
                MapService.setFilter(filterName, value);
            } else {
                if (filterName === "Tutte") {
                    for (var i in modalScope.vm.filters) {
                        modalScope.vm.filters[i].value = value;
                        MapService.setFilter(i, value);
                    }
                } else {
                    MapService.setFilter(filterName, value);
                    modalScope.vm.filters[filterName].value = value;
                    modalScope.vm.filters["Tutte"].value = areAllActive(modalScope.vm.filters);
                }
            }
        };

        modalScope.vm.updateBaseMap = function (name) {
            if (modalScope.vm.currentMapLayer === name) {
                return;
            }
            MapService.activateMapLayer(name);
            modalScope.vm.currentMapLayer = name;
        };

        var openFilters = function () {
            var filt = MapService.getActiveFilters();
            if (modalScope.vm.isNewModal) {
                modalScope.vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";;
                modalScope.vm.defaultLang = CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual ? CONFIG.LANGUAGES.actual : 'it';;
                for (var layerId in modalScope.layers) {
                    if (filt[layerId]) {
                        modalScope.layers[layerId].checked = filt[layerId];
                    } else {
                        modalScope.layers[layerId].checked = false;
                    }
                }
                checkAllTabsState();
            } else {
                lang = $translate.preferredLanguage(),
                    tmp = {},
                    allActive = false,
                    activeFilters = {};

                tmp["Tutte"] = {
                    name: $translate.instant("Tutte"),
                    value: true
                };

                for (var i in CONFIG.OVERLAY_LAYERS) {
                    var nameTranslated = CONFIG.OVERLAY_LAYERS[i].label;

                    if (nameTranslated.toLowerCase() === 'tappe' || nameTranslated.toLowerCase() === 'stages') {
                        nameTranslated = $translate.instant('Tappe');
                    } else if (CONFIG.OVERLAY_LAYERS[i].languages && CONFIG.OVERLAY_LAYERS[i].languages[lang]) {
                        nameTranslated = CONFIG.OVERLAY_LAYERS[i].languages[lang];
                    }

                    activeFilters[CONFIG.OVERLAY_LAYERS[i].label] = {
                        name: nameTranslated,
                        value: filt[CONFIG.OVERLAY_LAYERS[i].label],
                        icon: CONFIG.OVERLAY_LAYERS[i].icon,
                        color: CONFIG.OVERLAY_LAYERS[i].color
                    };
                }

                activeFilters = angular.extend(tmp, activeFilters);
                allActive = areAllActive(activeFilters);

                activeFilters["Tutte"].value = allActive;
                modalScope.vm.filters = activeFilters;
                modalScope.vm.currentMapLayer = MapService.getCurrentMapLayerName();
            }

            modal.show();

            if (modalScope.vm.isNewModal) {
                collapseAll();
                vm.initialFilters = angular.copy(MapService.getActiveFilters());
            }
        };

        $scope.$on('$destroy', function () {
            modal.hide();
            modal.remove();
        });

        $rootScope.$on('item-navigable', function (e, value) {
            vm.isNavigable = value;
            Utils.forceDigest();
        });

        if (modalScope.vm.isNewModal) {
            var checkBoxState = {
                EMPTY: 0,
                INDETERMINATED: 1,
                FULL: 2
            };
            var overlayLayerConfMap = MapService.overlayLayersConfMap();

            modalScope.vm.isMapModal = true;
            modalScope.filters = angular.copy(CONFIG.MAP.filters);
            modalScope.layers = {};
            modalScope.tabNum = 0;

            for (var tabIndex in modalScope.filters) {
                if (!modalScope.filters[tabIndex].sublayers) {
                    delete modalScope.filters[tabIndex];
                } else {
                    modalScope.tabNum += 1;

                    if (tabIndex === 'pois') {
                        modalScope.filters[tabIndex].label = "Luoghi";
                        modalScope.filters[tabIndex].languages = {
                            it: "Luoghi",
                            en: "Places"
                        };
                    } else if (tabIndex === 'tracks') {
                        modalScope.filters[tabIndex].label = "Tracciati";
                        modalScope.filters[tabIndex].languages = {
                            it: "Tracciati",
                            en: "Routes"
                        };
                    } else {
                        modalScope.filters[tabIndex].label = "Mappe";
                        modalScope.filters[tabIndex].languages = {
                            it: "Mappe",
                            en: "Maps"
                        };
                    }

                    var subTabs = modalScope.filters[tabIndex].sublayers;
                    modalScope.filters[tabIndex].selectedTab = -1;

                    for (var subTabIndex in subTabs) {
                        var subTab = subTabs[subTabIndex];
                        subTab.checked = false;
                        var tmp = [];
                        for (var index in subTab.items) {
                            var layerId = subTab.items[index];
                            var layer = MapService.getOverlayLayerById(layerId);
                            if (layer) {
                                var translatedLabel = layer.languages;
                                var info = {
                                    id: layerId,
                                    label: layer.label,
                                    checked: false,
                                    languages: translatedLabel
                                };
                                info.clickable = true;
                                tmp.push(info);
                                modalScope.layers[layer.label] = info;
                            }
                        }
                        subTab.items = tmp;
                    }
                }
            }

            for (const label in overlayLayerConfMap) {
                if (!modalScope.layers[label]) {
                    var trackIndex = -1;
                    var poiIndex = -1;
                    var layer = overlayLayerConfMap[label];
                    if (layer.type === 'poi_geojson') {
                        var macroCategories = modalScope.filters["pois"].sublayers;
                        for (let i = 0; i < macroCategories.length; i++) {
                            var macroCat = macroCategories[i];
                            if (macroCat.label.it === 'altri') {
                                poiIndex = i;
                                break;
                            }
                        }
                        if (poiIndex == -1) {
                            poiIndex = macroCategories.length;
                            macroCategories[poiIndex] = {
                                label: {
                                    it: "altri",
                                    en: "others"
                                },
                                items: [],
                                isMacroCategoryGroup: true
                            };
                        }

                        if (poiIndex > -1 && macroCategories[poiIndex].isMacroCategoryGroup) {
                            var translatedLabel = layer.languages;
                            if (!translatedLabel) {
                                translatedLabel = {
                                    it: layer.label
                                };
                            }
                            var info = {
                                id: layer.id,
                                label: layer.label,
                                checked: false,
                                languages: translatedLabel
                            };
                            info.clickable = true;
                            modalScope.layers[layer.label] = info;
                            macroCategories[poiIndex].items.push(info);
                        }
                    } else if (layer.type === 'line_geojson') {
                        var macroCategories = modalScope.filters["tracks"].sublayers;
                        if (trackIndex == -1) {
                            for (let i = 0; i < macroCategories.length; i++) {
                                var macroCat = macroCategories[i];
                                if (macroCat.label.it === 'altri') {
                                    trackIndex = i;
                                    break;
                                }
                            }
                        }
                        if (trackIndex == -1) {
                            trackIndex = macroCategories.length;
                            macroCategories[trackIndex] = {
                                label: {
                                    it: "altri",
                                    en: "others"
                                },
                                items: [],
                                isMacroCategoryGroup: true
                            };
                        }
                        if (trackIndex > -1 && macroCategories[trackIndex].isMacroCategoryGroup) {
                            var translatedLabel = layer.languages;
                            if (!translatedLabel) {
                                translatedLabel = {
                                    it: layer.label
                                };
                            }
                            var info = {
                                id: layer.id,
                                label: layer.label,
                                checked: false,
                                languages: translatedLabel
                            };
                            info.clickable = true;
                            modalScope.layers[layer.label] = info;
                            macroCategories[trackIndex].items.push(info);
                        }
                    }
                }
            }

            modalScope.currentTab = Object.keys(modalScope.filters)[0];

            modalScope.switchTab = function (id) {
                if (modalScope.filters[id])
                    modalScope.currentTab = id;
                else {
                    modalScope.currentTab = Object.keys(modalScope.filters)[0];
                }
            };

            modalScope.toggleSubTab = function (id, tabId) {
                var toCollapse = modalScope.filters[tabId].selectedTab >= 0 ? modalScope.filters[tabId].selectedTab : null;
                toCollapse = document.getElementById('sublayer-' + tabId + '-' + toCollapse);

                if (toCollapse) {
                    Utils.collapseDOMElement(toCollapse, 35);
                }

                if (+modalScope.filters[tabId].selectedTab !== +id) {
                    var toExpand = document.getElementById('sublayer-' + tabId + '-' + id);
                    if (toExpand) {
                        Utils.expandDOMElement(toExpand);
                    }

                    modalScope.filters[tabId].selectedTab = id;
                } else {
                    modalScope.filters[tabId].selectedTab = -1;
                }

                Utils.forceDigest();
            };

            modalScope.toggleSubTabCheckBox = function (id, tabId) {
                if (modalScope.filters[tabId] && modalScope.filters[tabId].sublayers[id]) {
                    if (modalScope.filters[tabId].sublayers[id].checked) {
                        var items = modalScope.filters[tabId].sublayers[id].items;
                        for (var index in items) {
                            if (items[index].checked) {
                                items[index].checked = !items[index].checked;
                                MapService.setFilter(items[index].label, false);
                            }
                        }
                    } else {
                        var items = modalScope.filters[tabId].sublayers[id].items;
                        for (var index in items) {
                            if (!items[index].checked) {
                                items[index].checked = !items[index].checked;
                                MapService.setFilter(items[index].label, true);
                            }
                        }
                    }
                    modalScope.filters[tabId].sublayers[id].checked = !modalScope.filters[tabId].sublayers[id].checked;
                    checkTabState(id, tabId);
                }
            }

            modalScope.lastToggledLayer = "";

            modalScope.toggleLayer = function (layerLabel, sublayerId, tabId) {
                if (modalScope.lastToggledLayer !== layerLabel) {
                    modalScope.lastToggledLayer = layerLabel;
                    modalScope.layers[layerLabel].checked = !modalScope.layers[layerLabel].checked;
                    modalScope.vm.updateFilter(layerLabel, modalScope.layers[layerLabel].checked);
                    checkTabState(sublayerId, tabId);
                    setTimeout(function () {
                        modalScope.lastToggledLayer = ""
                    }, 200);
                }
            };

            var checkTabState = function (sublayerId, tabId) {
                var state = true;
                var atLeastOne = false;
                var sublayer = modalScope.filters[tabId].sublayers[sublayerId];
                for (var index in sublayer.items) {
                    var layerChecked = sublayer.items[index].checked;
                    if (!layerChecked) {
                        state = false;
                    } else {
                        atLeastOne = true;
                    }
                }
                if (state) {
                    sublayer.checked = checkBoxState.FULL;
                } else if (!state && atLeastOne) {
                    sublayer.checked = checkBoxState.INDETERMINATED;
                } else {
                    sublayer.checked = checkBoxState.EMPTY;
                }
            };

            var checkAllTabsState = function () {
                for (var tabId in modalScope.filters) {
                    var tab = modalScope.filters[tabId];
                    for (var sublayerId in tab.sublayers) {
                        checkTabState(sublayerId, tabId);
                    }
                }
            };

            var getFeaturesToDisplay = function () {
                var filt = MapService.getActiveFilters();
                var result = {};

                if (MapService.isReady()) {
                    var ids = [];
                    var idsMap = MapService.getFeaturesIdByLayersMap();
                    var featureMap = MapService.getFeatureIdMap();

                    for (label in filt) {
                        if (filt[label] && idsMap[label] && modalScope.layers[label]) {
                            ids = ids.concat(idsMap[label]);
                        }
                    }

                    var tmp = ids.filter(function (item, pos) {
                        return ids.indexOf(item) == pos;
                    });

                    ids = tmp;

                    for (let i = 0; i < ids.length; i++) {
                        var feature = featureMap[ids[i]];

                        if (feature && feature.properties && feature.properties.taxonomy &&
                            feature.properties.taxonomy.webmapp_category) {
                            var categories = feature.properties.taxonomy.webmapp_category;
                            for (let j = 0; j < categories.length; j++) {
                                var overlayLayer = MapService.getOverlayLayerById(categories[j]);
                                if (overlayLayer && filt[overlayLayer.label]) {
                                    if (!result[overlayLayer.label]) {
                                        result[overlayLayer.label] = [];
                                    }
                                    result[overlayLayer.label].push(feature);
                                    break;
                                }
                            }
                        }
                    }
                }

                return result;
            };

            var collapseAll = function () {
                for (superId in modalScope.filters) {
                    for (macroId in modalScope.filters[superId].sublayers) {
                        if (macroId !== Object.keys(modalScope.filters[superId].sublayers)[0]) {
                            var element = document.getElementById('sublayer-' + superId + '-' + macroId);
                            if (element) {
                                Utils.collapseDOMElement(element, 36);
                            }
                        } else {
                            modalScope.filters[superId].selectedTab = macroId;
                        }
                    }
                }
            };

            setTimeout(function () {
                var features = getFeaturesToDisplay();
                MapService.addFeaturesToFilteredLayer(features);
            }, 300);
        }

        $scope.$on('$ionicView.afterEnter', function () {
            setTimeout(function () {
                if ($rootScope.highlightTrack && $rootScope.highlightTrack.parentId && $rootScope.highlightTrack.id) {
                    MapService.highlightTrack($rootScope.highlightTrack.id, $rootScope.highlightTrack.parentId);

                    $rootScope.highlightTrack = null;
                    delete $rootScope.highlightTrack;
                }
            }, 1000);
        });

        $scope.$on('$ionicView.beforeLeave', function () {
            modal.remove();
        });

        vm.clickRightMenu = function () {
            if (trackRecordingEnabled) {
                $rootScope.$emit("rightMenuClick");
            } else {
                openFilters();
            }
        }
        var openFiltersListener = $rootScope.$on("openFilters", function () {
            openFilters();
        });
        $scope.$on('$destroy', function () {
            openFiltersListener();
            modal.hide();
        });

        return vm;
    });