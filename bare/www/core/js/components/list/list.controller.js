angular.module('webmapp')

    .controller('ListController', function ListController(
        $rootScope,
        $state,
        $ionicLoading,
        $ionicScrollDelegate,
        Utils,
        MapService,
        Model,
        Search,
        CONFIG
    ) {
        var vm = {};

        var overlaysGroupMap = Model.getOverlaysGroupMap(),
            overlayMap = Model.getOverlaysMap();

        var isAnOverlayGroup = false,
            realState = '';

        vm.colors = CONFIG.MAIN ? CONFIG.MAIN.STYLE : CONFIG.STYLE;
        vm.isListExpanded = false,
        vm.layersMap = Model.getLayersMap();
        vm.goTo = Utils.goTo;
        vm.id = $state.params.id ? $state.params.id.replace(/_/g, ' ') : null;

        MapService.activateUtfGrid();

        var getMenuByState = function (state) {
            var group = Model.isAnOverlayGroup(state),
                currentOverlay,
                res = [];

            if (group) {
                for (var i in group.items) {
                    currentOverlay = Model.getOverlay(group.items[i]);
                    if (currentOverlay) {
                        currentOverlay.url = currentOverlay.label.replace(/ /g, '_');
                        res.push(currentOverlay);
                    }
                }
            }

            return res;
        };

        var getPagesByState = function (state) {
            var group = Model.isAPageGroup(state),
                currentPage,
                res = [];

            if (group) {
                for (var i in group.items) {
                    currentPage = Model.getPage(group.items[i]);
                    if (currentPage) {
                        currentPage.url = currentPage.label.replace(/ /g, '_');
                        res.push(currentPage);
                    }
                }
            }

            return res;
        };

        var compareTitles = function (a, b) {
            if (a.properties.name.toUpperCase() < b.properties.name.toUpperCase()) {
                return -1;
            }
            if (a.properties.name.toUpperCase() > b.properties.name.toUpperCase()) {
                return 1;
            }
            return 0;
        };

        var reinit = function () {
            if (MapService.isReady()) {
                init();
            }
            else {
                setTimeout(reinit, 250);
            }
        };

        var init = function () {
            $ionicLoading.show({
                template: '<ion-spinner></ion-spinner>'
            });
            var currentState = $rootScope.currentState.name,
                parentState = {},
                layersReferences,
                layerConfMap = {},
                currentName = '';

            vm.subMenuLabel = null;
            vm.subGroupMenu = null;
            vm.subMenu = null;
            vm.showCategoryBack = null;
            vm.eventsList = null;
            vm.backItem = null;

            if ($state && $state.params &&
                $state.params.id) {
                currentName = $state.params.id.replace(/_/g, ' ');
            }

            if (currentState === 'app.main.events') {
                vm.eventsList = MapService.getEventsList();
            } else if (currentState === 'app.main.layer') {
                vm.color = Model.getListColor(currentName);

                layersReferences = MapService.getOverlayLayers();
                layerConfMap = MapService.overlayLayersConfMap();
                realState = $rootScope.currentParams.id.replace(/_/g, ' ');
                isAnOverlayGroup = Model.isAnOverlayGroup(realState);

                if (!isAnOverlayGroup && typeof layerConfMap[realState] === 'undefined') {
                    Utils.goTo('map/');
                    return;
                }

                if (!isAnOverlayGroup && typeof layersReferences[realState] === 'undefined') {
                    $ionicLoading.show({
                        template: '<ion-spinner></ion-spinner>'
                    });
                }

                vm.currentCategory = $rootScope.currentParams.id;
                vm.viewTitle = realState;
                vm.showCount = !isAnOverlayGroup;
                vm.showCategoryBack = Model.isAChild(realState);

                if (typeof overlayMap[realState] !== 'undefined' ||
                    typeof overlaysGroupMap[realState] !== 'undefined') {

                    if (Model.isAnOverlayGroup(realState)) {
                        vm.subGroupMenu = getMenuByState(realState);
                    } else {
                        if (MapService.isReady()) {
                            $ionicLoading.show({
                                template: '<ion-spinner></ion-spinner>'
                            });
                            vm.layersMap[realState].items.sort(compareTitles);
                            vm.subMenuLabel = realState;

                            if (realState !== 'Eventi') {
                                vm.lettersPosition = {};
                                var lastLetter = '',
                                    alphaRegex = /[A-Z]/g;

                                for (var i in vm.layersMap[realState].items) {
                                    var letter = vm.layersMap[realState].items[i].properties.name[0].toUpperCase();
                                    if (letter !== lastLetter) {
                                        if (lastLetter === '') {
                                            if (alphaRegex.test(letter)) {
                                                vm.lettersPosition[letter] = +i;
                                            }
                                            else {
                                                vm.lettersPosition['*'] = +i;
                                            }
                                            
                                            lastLetter = letter;
                                        }
                                        else if (alphaRegex.test(letter)) {
                                            vm.lettersPosition[letter] = +i;
                                            lastLetter = letter;
                                        }
                                    }
                                }
                            }

                            // vm.subMenu = [];

                            // Utils.slowAdd(angular.extend([], vm.layersMap[realState].items), vm.subMenu, true);
                            // vm.subMenu.sort(compareTitles);
                            $ionicLoading.hide();
                        } else {
                            reinit();
                            return;
                        }

                        parentState = Model.getOverlayParent(realState);

                        if (parentState) {
                            vm.backItem = {
                                label: parentState.label,
                                url: parentState.label.replace(/ /g, '_')
                            };
                        }

                    }
                }
            } else if (Model.isAPageGroup(currentName)) {
                vm.color = Model.getListColor(currentName);
                realState = $rootScope.currentParams.id.replace(/_/g, ' ');
                vm.viewTitle = realState;
                vm.subGroupMenu = getPagesByState(currentName);
            }
            // console.log(vm)
        };

        vm.scrollToDivider = function (key) {
            var height = vm.lettersPosition[key] * 99.9;
            $ionicScrollDelegate.scrollTo(0, height, 0);
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

        vm.renderEventDate = function (date) {
            return date.substring(6, 8) + '/' + date.substring(4, 6) + '/' + date.substring(0, 4);
        };

        vm.toggleList = function () {
            vm.isListExpanded = !vm.isListExpanded;
            $rootScope.$emit('toggle-list', vm.isListExpanded);
        };

        vm.goToSearch = function () {
            if (isAnOverlayGroup) {
                Search.setActiveAllLayers();
            } else {
                Search.setActiveLayers(realState);
            }

            vm.goTo('search');
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

        $ionicLoading.show({
            template: '<ion-spinner></ion-spinner>'
        });
        setTimeout(reinit, 250);

        vm.toggleList();

        return vm;
    });