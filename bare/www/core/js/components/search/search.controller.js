/*global angular*/

angular.module('webmapp')

    .controller('SearchController', function SearchController(
        Search,
        MapService,
        Utils,
        $ionicModal,
        $ionicScrollDelegate,
        $rootScope,
        CONFIG,
        $ionicLoading,
        $location,
        $translate,
        $window
    ) {
        var vm = {};

        var modalScope = $rootScope.$new(),
            modal = {},
            lastQuery;

        var options = CONFIG.OPTIONS;
        var currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";
        var defaultLang = CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual ? CONFIG.LANGUAGES.actual : 'it';

        modalScope.vm = {};

        modalScope.vm.isNewModal = CONFIG.MAP.filters ? true : false;

        vm.showInMap = !options.hideShowInMapFromSearch;
        vm.colors = CONFIG.MAIN ? CONFIG.MAIN.STYLE : CONFIG.STYLE;
        vm.results = [];
        vm.goBack = Utils.goBack;
        vm.currentQuery = "";

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
                vm.translatedFiltersList = vm.translateOverlayInArray(vm.filtersList);
                vm.othersCount = String(vm.filtersList.length - 1);
                var results = Search.getByLayersLexicalOrder(lastQuery);
                updateClickableCheckBoxes(results);
                vm.results = vm.translateOverlayInArray(results);
                MapService.addFeaturesToFilteredLayer(Search.getByLayersGroupedByLayer(lastQuery));

                vm.results.realLength = 0;
                vm.lettersPosition = {};
                for (var i in vm.results) {
                    if (vm.results[i].id) {
                        vm.results.realLength = vm.results.realLength + 1;
                    }
                    else if (vm.results[i].label) {
                        vm.lettersPosition[vm.results[i].label] = i;
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
                MapService.addFeaturesToFilteredLayer(Search.getByLayersGroupedByLayer(lastQuery, vm.filtersList));

            }

            $ionicScrollDelegate.scrollTop();
        };

        modalScope.vm.hide = function () {
            modal.hide();
        };

        vm.closeKeyboard = function () {
            cordova && cordova.plugins.Keyboard.close();
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
                updateClickableCheckBoxes([]);
                checkAllTabsState();

            } else {
                lang = $translate.preferredLanguage(),
                    tmp = {},
                    allActive = false,
                    activeFilters = {};

                for (var i in CONFIG.OVERLAY_LAYERS) {
                    var nameTranslated = CONFIG.OVERLAY_LAYERS[i].label;

                    if (CONFIG.OVERLAY_LAYERS[i].languages && CONFIG.OVERLAY_LAYERS[i].languages[lang]) {
                        nameTranslated = CONFIG.OVERLAY_LAYERS[i].languages[lang];
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
        };

        vm.goTo = function (path, isDivider) {
            if (isDivider) {
                return;
            }

            Utils.goTo(path);
        };

        vm.updateSearch = function (query) {
            vm.results = vm.translateOverlayInArray(Search.getByLayersLexicalOrder(query, Search.getActiveLayers()));
            updateClickableCheckBoxes(vm.results);
            vm.results.realLength = 0;

            vm.lettersPosition = {};
            for (var i in vm.results) {
                if (vm.results[i].id) {
                    vm.results.realLength = vm.results.realLength + 1;
                }
                else if (vm.results[i].label) {
                    vm.lettersPosition[vm.results[i].label] = i;
                }
            }

            MapService.addFeaturesToFilteredLayer(Search.getByLayersGroupedByLayer(query, Search.getActiveLayers()));
            $ionicScrollDelegate.scrollTop();
            lastQuery = query;
        };

        vm.toggleMap = function () {
            vm.isMapView = !vm.isMapView;
            $rootScope.$emit('toggle-map-in-search', vm.isMapView);
        };

        vm.getSpecialities = function (item) {
            var specialities = "";
            if (item.properties && item.properties.taxonomy && item.properties.taxonomy.specialita) {
                for (var i in item.properties.taxonomy.specialita) {
                    if (specialities !== "") {
                        specialities += ", ";
                    }
                    specialities += MapService.getLayerLabelById(item.properties.taxonomy.specialita[i]);
                }
            }
            return specialities;
        };

        vm.scrollToDivider = function (id) {
            var height = 0;

            var dividers = 0;

            for (var i in vm.lettersPosition) {
                if (i === id) {
                    break;
                }
                else {
                    dividers++;
                }
            }

            height = dividers * 62 + (vm.lettersPosition[id] - dividers) * 94;
            // console.log(height)
            // $location.hash('alpha-scroll-' + id);

            $ionicScrollDelegate.scrollTo(0, height, 0);
        };

        vm.init = function () {
            if ($rootScope.searchQuery || $rootScope.searchLayers) {
                setSearchState($rootScope.searchLayers, $rootScope.searchQuery);
                delete $rootScope.searchQuery
                delete $rootScope.searchLayers
            } else {
                setTimeout(function () {
                    vm.updateSearch();
                }, 10);
            }
        };

        var checkMapLoaded = function () {
            if (MapService.isReady()) {
                vm.init();
                $ionicLoading.hide();
            }
            else {
                setTimeout(checkMapLoaded, 250);
            }
        };

        $ionicLoading.show({
            template: '<ion-spinner></ion-spinner>'
        });

        vm.width = $window.screen.availWidth - 30;
        if (modalScope.vm.isNewModal) {
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
                        modalScope.filters[tabIndex].label = "Punti";
                    } else if (tabIndex === 'tracks') {
                        modalScope.filters[tabIndex].label = "Traccie";
                    } else {
                        modalScope.filters[tabIndex].label = "Mappe";
                    }
                    var subTabs = modalScope.filters[tabIndex].sublayers;
                    modalScope.filters[tabIndex].selectedTab = 0;
                    for (var subTabIndex in subTabs) {
                        var subTab = subTabs[subTabIndex];
                        subTab.checked = false;
                        if (subTab.label === "custom") {
                            subTab.label = "altri";
                        }
                        var tmp = [];
                        for (var index in subTab.items) {
                            var layerId = subTab.items[index];
                            var layer = MapService.getOverlayLayerById(layerId);
                            if (layer) {
                                var translatedLabel = layer.languages;
                                var info = { id: layerId, label: layer.label, checked: false, clickable: true, languages: translatedLabel };
                                tmp.push(info);
                                modalScope.layers[layer.label] = info;
                            }
                        }
                        subTab.items = tmp;
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

                if (modalScope.filters[tabId].selectedTab !== id) {
                    modalScope.filters[tabId].selectedTab = id;
                } else {
                    modalScope.filters[tabId].selectedTab = null;
                }

            };

            modalScope.toggleSubTabCheckBox = function (id, tabId) {

                if (modalScope.filters[tabId] && modalScope.filters[tabId].sublayers[id]) {
                    if (modalScope.filters[tabId].sublayers[id].checked) {

                        var items = modalScope.filters[tabId].sublayers[id].items;
                        for (var index in items) {
                            if (items[index].checked) {
                                items[index].checked = !items[index].checked;
                                modalScope.vm.updateFilter(items[index].label, false);
                            }
                        }

                    } else {

                        var items = modalScope.filters[tabId].sublayers[id].items;
                        for (var index in items) {
                            if (!items[index].checked) {
                                items[index].checked = !items[index].checked;
                                modalScope.vm.updateFilter(items[index].label, true);
                            }
                        }

                    }
                    modalScope.filters[tabId].sublayers[id].checked = !modalScope.filters[tabId].sublayers[id].checked;
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
                    setTimeout(function () { modalScope.lastToggledLayer = "" }, 200);
                }

            };


            var checkTabState = function (sublayerId, tabId) {

                var state = true;
                var sublayer = modalScope.filters[tabId].sublayers[sublayerId];
                for (var index in sublayer.items) {
                    var layerChecked = sublayer.items[index].checked;
                    if (!layerChecked) {
                        state = false;
                        break;
                    }
                }
                sublayer.checked = state;

            };

            var checkAllTabsState = function () {

                for (var tabId in modalScope.filters) {
                    var tab = modalScope.filters[tabId];
                    for (var sublayerId in tab.sublayers) {
                        checkTabState(sublayerId, tabId);
                    }
                }

            };

            var setSearchState = function (filters, q) {
                var layers = typeof filters === "undefined" ? [] : filters;
                var query = typeof q === "undefined" ? "" : q;
                for (var layerId in modalScope.layers) {
                    modalScope.layers[layerId].checked = false;
                }

                layers = layers.filter(function (el) {
                    return featuresIdByLayersMap[el];
                })

                Search.setActiveLayers(layers);
                vm.updateSearch(query);
                vm.currentQuery = query;

            };

            var updateClickableCheckBoxes = function (result) {

                if (typeof result === "undefined")
                    return;

                for (var label in modalScope.layers) {
                    modalScope.layers[label].clickable = true;
                }

                var prevFilters = Search.getActiveLayers();
                for (var type in modalScope.filters) {

                    if (type !== "base_maps") {

                        var superCategory = modalScope.filters[type];
                        for (var i = 0; i < superCategory.sublayers.length; i++) {

                            var macroCategory = superCategory.sublayers[i];
                            var baseFilters = angular.copy(prevFilters);
                            var categoriesContainerMap = {};

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
                            var results = Search.getFeatures(lastQuery);

                            for (let k = 0; k < results.length; k++) {
                                var layer = results[k];
                                if (layer.properties && layer.properties.taxonomy) {
                                    if (macroCategory.label.en === "Types of content") {

                                        var tipoArray = layer.properties.taxonomy.tipo;
                                        for (var n = 0; n < tipoArray.length; n++) {
                                            var id = tipoArray[n];
                                            if (id === "restaurant") {
                                                id = "4";
                                            } else if (id === "producer") {
                                                id = "3";
                                            } else if (id === "shop") {
                                                id = "1";
                                            } else if (id === "event") {
                                                id = "2";
                                            }
                                            tipoArray[n] = id;
                                        }

                                        for (var layerId in categoriesContainerMap) {
                                            if (tipoArray.indexOf(layerId) > -1) {
                                                categoriesContainerMap[layerId] = true;
                                            }
                                        }

                                    } else if (macroCategory.label.en === "Speciality") {

                                        var tipoArray = layer.properties.taxonomy.specialita;
                                        for (var layerId in categoriesContainerMap) {
                                            var id = Number(layerId);
                                            if (tipoArray.indexOf(id) > -1) {

                                                categoriesContainerMap[layerId] = true;
                                            }
                                        }

                                    } else if (macroCategory.label.en === "Places") {

                                        var tipoArray = layer.properties.taxonomy.localita;
                                        for (var key in categoriesContainerMap) {
                                            if (tipoArray.indexOf(key) > -1) {
                                                categoriesContainerMap[key] = true;
                                            }
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

        checkMapLoaded();

        return vm;
    });