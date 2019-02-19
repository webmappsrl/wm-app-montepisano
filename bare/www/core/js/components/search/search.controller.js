/*global angular*/

angular.module('webmapp')

    .controller('SearchController', function SearchController(
        $ionicModal,
        $rootScope,
        $ionicScrollDelegate,
        $scope,
        $translate,
        CONFIG,
        MapService,
        Search,
        Utils
    ) {
        var vm = {};

        var modalScope = $rootScope.$new(),
            modal = {},
            lastQuery;

        var options = CONFIG.OPTIONS,
            currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it",
            defaultLang = CONFIG.MAIN ? (CONFIG.MAIN.LANGUAGES && CONFIG.MAIN.LANGUAGES.actual ? CONFIG.MAIN.LANGUAGES.actual.substring(0, 2) : "it") :
                ((CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual) ? CONFIG.LANGUAGES.actual.substring(0, 2) : 'it');

        modalScope.vm = {};

        modalScope.vm.isNewModal = CONFIG.MAP.filters ? true : false;

        vm.showInMap = !options.hideShowInMapFromSearch;
        vm.colors = CONFIG.MAIN ? CONFIG.MAIN.STYLE : CONFIG.STYLE;
        vm.results = [];
        vm.goBack = Utils.goBack;

        modalScope.vm.COLORS = vm.colors;

        vm.isMapView = false;


        setTimeout(function () {
            MapService.resetView();
            vm.searchReady = true;
        }, 100);

        $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/filtersModal.html', {
            scope: modalScope,
            animation: 'slide-in-up'
        }).then(function (modalObj) {
            modal = modalObj;
        });

        var areAllActive = function (filtersMap) {
            var allActive = true;

            for (var i in filtersMap) {
                if (i !== $translate.instant("Tutte")) {
                    if (!filtersMap[i].state) {
                        allActive = false;
                        break;
                    }
                }
            }

            return allActive;
        };

        var collapseAll = function () {
            for (superId in modalScope.filters) {
                for (macroId in modalScope.filters[superId].sublayers) {
                    if (macroId !== Object.keys(modalScope.filters[superId].sublayers)[0]) {
                        var element = document.getElementById('sublayer-' + superId + '-' + macroId);
                        if (element) {
                            Utils.collapseDOMElement(element, 35);
                        }
                    } else {
                        modalScope.filters[superId].selectedTab = macroId;
                    }
                }
            }
            Utils.forceDigest();
        };

        vm.areAllActive = areAllActive(Search.getActiveLayersMap());
        vm.filtersList = Search.getActiveLayers();
        vm.othersCount = String(vm.filtersList.length - 1);
        vm.translatedFiltersList = vm.filtersList;

        vm.translateOverlayInArray = function (array) {
            var translated = [];
            for (var i in array) {
                var translatedName = "";
                if (array[i].label) {
                    translatedName = array[i].label;
                }
                if (typeof (array[i]) === "string") {
                    translatedName = array[i];
                }

                if (translatedName !== "") {
                    for (var pos in CONFIG.OVERLAY_LAYERS) {
                        if (CONFIG.OVERLAY_LAYERS[pos].label === translatedName &&
                            CONFIG.OVERLAY_LAYERS[pos].languages &&
                            CONFIG.OVERLAY_LAYERS[pos].languages[currentLang]) {
                            translatedName = CONFIG.OVERLAY_LAYERS[pos].languages[currentLang];
                        }
                        else if (CONFIG.OVERLAY_LAYERS[pos].label === translatedName &&
                            CONFIG.OVERLAY_LAYERS[pos].languages &&
                            CONFIG.OVERLAY_LAYERS[pos].languages[defaultLang]) {
                            translatedName = CONFIG.OVERLAY_LAYERS[pos].languages[defaultLang];
                        }
                    }

                    if (array[i].label) {
                        translated[i] = array[i];
                        translated[i].label = translatedName;
                    } else {
                        translated[i] = translatedName;
                    }
                } else {
                    translated[i] = array[i];
                }
            }

            return translated;
        };

        vm.translatedFiltersList = vm.translateOverlayInArray(vm.translatedFiltersList);

        modalScope.vm.updateFilter = function (filterName, value) {
            if (modalScope.vm.isNewModal) {
                var toUpdate = [];

                for (var i in modalScope.layers) {
                    if (modalScope.layers[i].checked) {
                        toUpdate.push(i);
                    }
                }

                Search.setActiveLayers(toUpdate);
                vm.filtersList = Search.getActiveLayers();
                vm.translatedFiltersList = vm.translateOverlayInArray(vm.filtersList);
                vm.othersCount = String(vm.filtersList.length - 1);
                vm.areAllActive = areAllActive(Search.getActiveLayersMap());

                var results = Search.getByLayersWithDivider(lastQuery, vm.filtersList);
                updateClickableCheckBoxes();
                vm.results = vm.translateOverlayInArray(results);
                if (vm.showInMap) {
                    MapService.addFeaturesToFilteredLayer(Search.getByLayersGroupedByLayer(lastQuery, vm.filtersList));
                }

                vm.results.realLength = 0;

                for (var i in vm.results) {
                    if (vm.results[i].id) {
                        vm.results.realLength = vm.results.realLength + 1;
                    }
                }

            } else {

                var activeFilters = modalScope.vm.filters,
                    toUpdate = [];

                activeFilters[filterName].value = value;
                for (var i in activeFilters) {
                    if (activeFilters[i].value) {
                        toUpdate.push(i);
                    }
                }

                Search.setActiveLayers(toUpdate);
                vm.filtersList = Search.getActiveLayers();
                vm.translatedFiltersList = vm.translateOverlayInArray(vm.filtersList);
                vm.othersCount = String(vm.filtersList.length - 1);
                vm.areAllActive = modalScope.vm.areAllActive = areAllActive(Search.getActiveLayersMap());
                vm.results = vm.translateOverlayInArray(Search.getByLayersWithDivider(lastQuery, vm.filtersList));
                if (vm.showInMap) {
                    MapService.addFeaturesToFilteredLayer(Search.getByLayersGroupedByLayer(lastQuery, vm.filtersList));
                }

                vm.results.realLength = 0;

                for (var i in vm.results) {
                    if (vm.results[i].id) {
                        vm.results.realLength = vm.results.realLength + 1;
                    }
                }
            }

            $ionicScrollDelegate.scrollTop();
        };

        modalScope.vm.hide = function () {
            modal.hide();
        };

        vm.closeKeyboard = function () {
            // cordova && cordova.plugins.Keyboard.close();
        };

        vm.openFilters = function () {
            var filt = Search.getActiveLayersMap();
            if (modalScope.vm.isNewModal) {
                var featuresIdByLayersMap = MapService.getFeaturesIdByLayersMap();
                Search.setFeaturesIdByLayerMap(featuresIdByLayersMap);
                modalScope.vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";;
                modalScope.vm.defaultLang = CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual ? CONFIG.LANGUAGES.actual : 'it';;
                for (var layerId in modalScope.layers) {
                    if (filt[layerId]) {
                        modalScope.layers[layerId].checked = filt[layerId].state;
                    } else {
                        modalScope.layers[layerId].checked = false;
                    }
                }
                updateClickableCheckBoxes();
                checkAllTabsState();
            } else {
                var tmp = {},
                    allActive = false,
                    activeFilters = {};

                for (var i in CONFIG.OVERLAY_LAYERS) {
                    var nameTranslated = CONFIG.OVERLAY_LAYERS[i].label;

                    if (CONFIG.OVERLAY_LAYERS[i].languages && CONFIG.OVERLAY_LAYERS[i].languages[currentLang]) {
                        nameTranslated = CONFIG.OVERLAY_LAYERS[i].languages[currentLang];
                    }
                    else if (CONFIG.OVERLAY_LAYERS[i].languages && CONFIG.OVERLAY_LAYERS[i].languages[defaultLang]) {
                        nameTranslated = CONFIG.OVERLAY_LAYERS[i].languages[defaultLang];
                    }

                    activeFilters[CONFIG.OVERLAY_LAYERS[i].label] = {
                        name: nameTranslated,
                        value: filt[CONFIG.OVERLAY_LAYERS[i].label].state
                    };
                }

                // activeFilters = angular.extend(tmp, activeFilters);
                allActive = areAllActive(activeFilters);

                // activeFilters["Tutte"].value = allActive;
                modalScope.vm.filters = activeFilters;

                modalScope.vm.areAllActive = allActive;
            }

            modal.show();

            if (modalScope.vm.isNewModal) {
                collapseAll();
            }
        };

        vm.goTo = function (path, isDivider) {
            if (isDivider) {
                return;
            }

            Utils.goTo(path);
        };

        vm.updateSearch = function (query) {
            vm.results = vm.translateOverlayInArray(Search.getByLayersWithDivider(query, Search.getActiveLayers()));

            vm.results.realLength = 0;

            for (var i in vm.results) {
                if (vm.results[i].id) {
                    vm.results.realLength = vm.results.realLength + 1;
                }
            }

            if (vm.showInMap) {
                MapService.addFeaturesToFilteredLayer(Search.getByLayersGroupedByLayer(query, Search.getActiveLayers()));
            }
            $ionicScrollDelegate.scrollTop();
            lastQuery = query;
        };

        vm.toggleMap = function () {
            vm.isMapView = !vm.isMapView;
            $rootScope.$emit('toggle-map-in-search', vm.isMapView);
        };

        if (modalScope.vm.isNewModal) {
            var checkBoxState = {
                EMPTY: 0,
                INDETERMINATED: 1,
                FULL: 2
            };
            var searchLayersMap = CONFIG.OVERLAY_LAYERS.reduce(function (prev, curr) {
                if (!curr.skipSearch) {
                    prev[curr.label] = curr;
                }
                return prev;
            }, {});

            var featuresIdByLayersMap = MapService.getFeaturesIdByLayersMap();
            Search.setFeaturesIdByLayerMap(featuresIdByLayersMap);
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
                            en: "Places",
                            fr: "Endroits",
                            de: "Orte"
                        };
                    } else if (tabIndex === 'tracks') {
                        modalScope.filters[tabIndex].label = "Tracciati";
                        modalScope.filters[tabIndex].languages = {
                            it: "Tracciati",
                            en: "Routes",
                            fr: "Suivi",
                            de: "Verfolgt"
                        };
                    } else {
                        modalScope.filters[tabIndex].label = "Mappe";
                        modalScope.filters[tabIndex].languages = {
                            it: "Mappe",
                            en: "Maps",
                            fr: "Carte",
                            de: "Karte"
                        };
                    }
                    var subTabs = modalScope.filters[tabIndex].sublayers;
                    modalScope.filters[tabIndex].selectedTab = 0;
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
                                    clickable: true,
                                    languages: translatedLabel
                                };
                                tmp.push(info);
                                modalScope.layers[layer.label] = info;
                            }
                        }
                        subTab.items = tmp;
                    }
                }
            }

            for (const label in searchLayersMap) {
                if (!modalScope.layers[label]) {
                    var trackIndex = -1;
                    var poiIndex = -1;
                    var layer = searchLayersMap[label];
                    if (layer.type === 'poi_geojson') {
                        var macroCategories = modalScope.filters["pois"].sublayers;
                        for (var i = 0; i < macroCategories.length; i++) {
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
                            for (var i = 0; i < macroCategories.length; i++) {
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
                            }
                        }
                    } else {
                        var items = modalScope.filters[tabId].sublayers[id].items;
                        for (var index in items) {
                            if (!items[index].checked) {
                                items[index].checked = !items[index].checked;
                            }
                        }
                    }
                    modalScope.filters[tabId].sublayers[id].checked = !modalScope.filters[tabId].sublayers[id].checked;
                    modalScope.vm.updateFilter();
                    checkTabState(id, tabId);
                }
            }

            modalScope.lastToggledLayer = "";

            modalScope.toggleLayer = function (layerLabel, sublayerId, tabId) {
                if (modalScope.layers[layerLabel].clickable && modalScope.lastToggledLayer !== layerLabel) {
                    modalScope.lastToggledLayer = layerLabel;
                    var value = !modalScope.layers[layerLabel].checked;
                    modalScope.layers[layerLabel].checked = value;
                    modalScope.vm.updateFilter(layerLabel, value);
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
                        break;
                    }
                }
                if (state) {
                    sublayer.checked = checkBoxState.FULL;
                } else if (!state && atLeastOne) {
                    sublayer.checked = checkBoxState.INDETERMINATED;
                } else {
                    sublayer.checked = checkBoxState.EMPTY;
                }
            }

            var checkAllTabsState = function () {
                for (var tabId in modalScope.filters) {
                    var tab = modalScope.filters[tabId];
                    for (var sublayerId in tab.sublayers) {
                        checkTabState(sublayerId, tabId);
                    }
                }
            }

            var setSearchState = function (filters, q) {
                var layers = typeof filters === "undefined" ? [] : filters;
                var query = typeof q === "undefined" ? "" : q;

                for (var layerId in modalScope.layers) {
                    modalScope.layers[layerId].checked = false;
                }

                layers = layers.filter(function (el) {
                    return featuresIdByLayersMap[el];
                });

                Search.setActiveLayers(layers);
                vm.updateSearch(query);
                vm.startingString = query;
            }

            var updateClickableCheckBoxes = function () {
                var prevFilters = Search.getActiveLayers();

                for (var label in modalScope.layers) {
                    modalScope.layers[label].clickable = true;
                }

                for (var type in modalScope.filters) {
                    if (type !== "base_maps") {
                        var superCategory = modalScope.filters[type];
                        var ammissibleCategories = [];
                        for (var j = 0; j < superCategory.sublayers.length; j++) {
                            var macroCategory = superCategory.sublayers[j];
                            for (var k = 0; k < macroCategory.items.length; k++) {
                                var label = macroCategory.items[k].label;
                                ammissibleCategories.push(label);
                            }
                        }

                        for (var i = 0; i < superCategory.sublayers.length; i++) {
                            var macroCategory = superCategory.sublayers[i];
                            var baseFilters = angular.copy(prevFilters);
                            var categoriesContainerMap = {};
                            baseFilters = baseFilters.filter(function (ele) {
                                return (ammissibleCategories.indexOf(ele) > -1);
                            });

                            for (var m = 0; m < macroCategory.items.length; m++) {
                                var layer = macroCategory.items[m];
                                if (layer) {
                                    var label = layer.label;
                                    var index = baseFilters.indexOf(label);
                                    if (index > -1) {
                                        baseFilters.splice(index, 1);
                                    }
                                }

                                categoriesContainerMap[layer.id] = false;
                            }

                            Search.setActiveLayers(baseFilters);
                            var results = Search.getFeatures(lastQuery, Search.getActiveLayers());
                            for (var k = 0; k < results.length; k++) {
                                var layer = results[k];

                                if (layer.properties && layer.properties.taxonomy && layer.properties.taxonomy.webmapp_category) {
                                    var catArray = layer.properties.taxonomy.webmapp_category;
                                    for (var layerId in categoriesContainerMap) {
                                        var parsedID = Number(layerId);
                                        if (!parsedID) {
                                            parsedID = layerId;
                                        }
                                        if ((catArray.indexOf(parsedID) !== -1)) {
                                            categoriesContainerMap[layerId] = true;
                                        }
                                    }

                                    var allClickable = true;
                                    for (var key in categoriesContainerMap) {
                                        if (!categoriesContainerMap[key]) {
                                            var layer = MapService.getOverlayLayerById(key);
                                            if (layer && modalScope.layers[layer.label]) {
                                                allClickable = false;
                                                break;
                                            }
                                        }
                                    }

                                    if (allClickable) {
                                        break;
                                    }
                                }
                            }

                            for (var catId in categoriesContainerMap) {
                                var layer = MapService.getOverlayLayerById(catId);
                                if (layer && modalScope.layers[layer.label]) {
                                    if (!modalScope.layers[layer.label].checked) {
                                        modalScope.layers[layer.label].clickable = categoriesContainerMap[catId];
                                    }
                                }
                            }
                        }
                    }
                }
                Search.setActiveLayers(prevFilters);
            };
        }

        if ($rootScope.searchQuery || $rootScope.searchLayers) {
            setSearchState($rootScope.searchLayers, $rootScope.searchQuery);
            delete $rootScope.searchQuery
            delete $rootScope.searchLayers
        } else {
            setTimeout(function () {
                vm.updateSearch();
            }, 10);
        }

        $scope.$on('$ionicView.beforeLeave', function () {
            modal.remove();
        });

        return vm;
    });
