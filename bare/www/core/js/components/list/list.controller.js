angular
  .module("webmapp")

  .controller("ListController", function ListController(
    $ionicLoading,
    $rootScope,
    $state,
    $translate,
    CONFIG,
    MapService,
    Model,
    Search,
    Utils
  ) {
    var vm = {};

    var overlaysGroupMap = Model.getOverlaysGroupMap(),
      overlayMap = Model.getOverlaysMap();

    var isAnOverlayGroup = false,
      realState = "";

    vm.colors = CONFIG.MAIN ? CONFIG.MAIN.STYLE : CONFIG.STYLE;
    (vm.isListExpanded = false), (vm.layersMap = Model.getLayersMap());
    vm.goTo = Utils.goTo;
    vm.useSearch =
      CONFIG.SEARCH && CONFIG.SEARCH.active ? CONFIG.SEARCH.active : false;
    (vm.currentLang = $translate.preferredLanguage()
      ? $translate.preferredLanguage()
      : "it"),
      (vm.defaultLang = CONFIG.MAIN
        ? CONFIG.MAIN.LANGUAGES && CONFIG.MAIN.LANGUAGES.actual
          ? CONFIG.MAIN.LANGUAGES.actual.substring(0, 2)
          : "it"
        : CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual
        ? CONFIG.LANGUAGES.actual.substring(0, 2)
        : "it");

    MapService.activateUtfGrid();

    var getMenuByState = function(state) {
      var group = Model.isAnOverlayGroup(state),
        currentOverlay,
        res = [];

      if (group) {
        for (var i in group.items) {
          currentOverlay = Model.getOverlayMeta(group.items[i]);
          if (currentOverlay) {
            currentOverlay.url = currentOverlay.label.replace(/ /g, "_");
            res.push(currentOverlay);
          }
        }
      }

      return res;
    };

    var getPagesByState = function(state) {
      var group = Model.isAPageGroup(state),
        currentPage,
        res = [];

      if (group) {
        for (var i in group.items) {
          currentPage = Model.getPage(group.items[i]);
          if (currentPage) {
            currentPage.url = currentPage.label.replace(/ /g, "_");
            res.push(currentPage);
          }
        }
      }

      return res;
    };

    var init = function() {
      var currentState = $rootScope.currentState.name,
        parentState = {},
        layersReferences,
        layerConfMap = {},
        currentName = "";

      vm.subMenuLabel = null;
      vm.subGroupMenu = null;
      vm.subMenu = null;
      vm.showCategoryBack = null;
      vm.eventsList = null;
      vm.backItem = null;

      if ($state && $state.params && $state.params.id) {
        currentName = $state.params.id.replace(/_/g, " ");
      }

      if (currentState === "app.main.events") {
        vm.eventsList = MapService.getEventsList();
      } else if (currentState === "app.main.layer") {
        vm.color = Model.getListColor(currentName);

        layersReferences = MapService.getOverlayLayers();
        layerConfMap = MapService.overlayLayersConfMap();
        realState = $rootScope.currentParams.id.replace(/_/g, " ");
        isAnOverlayGroup = Model.isAnOverlayGroup(realState);

        if (
          !isAnOverlayGroup &&
          typeof layerConfMap[realState] === "undefined"
        ) {
          Utils.goTo("map/");
          return;
        }

        if (
          !isAnOverlayGroup &&
          typeof layersReferences[realState] === "undefined"
        ) {
          $ionicLoading.show({
            template: "<ion-spinner></ion-spinner>"
          });
        }

        vm.currentCategory = $rootScope.currentParams.id;
        vm.viewTitle = realState;
        vm.showCount = !isAnOverlayGroup;
        vm.showCategoryBack = Model.isAChild(realState);

        if (
          typeof overlayMap[realState] !== "undefined" ||
          typeof overlaysGroupMap[realState] !== "undefined"
        ) {
          if (Model.isAnOverlayGroup(realState)) {
            vm.subGroupMenu = getMenuByState(realState);
          } else {
            if (MapService.isReady()) {
              // vm.layersMap[realState].items.sort(function compare(a, b) {
              //     if (a.properties.name < b.properties.name)
              //         return -1;
              //     if (a.properties.name > b.properties.name)
              //         return 1;
              //     return 0;
              // });

              vm.subMenu = [];
              Utils.slowAdd(
                angular.extend([], vm.layersMap[realState].items),
                vm.subMenu,
                true
              );
            } else {
              vm.subMenuLabel = realState;
            }

            parentState = Model.getOverlayParent(realState);

            if (parentState) {
              vm.backItem = {
                label: parentState.label,
                url: parentState.label.replace(/ /g, "_")
              };
            }
          }
        }
      } else if (Model.isAPageGroup(currentName)) {
        vm.color = Model.getListColor(currentName);
        realState = $rootScope.currentParams.id.replace(/_/g, " ");
        vm.viewTitle = realState;
        vm.subGroupMenu = getPagesByState(currentName);
      }
      // console.log(vm)
    };

    vm.renderDate = function(date) {
      var parsedDate, month, year;

      if (date) {
        parsedDate = new Date(Number(date) * 1000);
        year = String(parsedDate.getFullYear()).substr(2);
        month = parsedDate.getMonth() + 1;
        month = String(month).length === 1 ? "0" + month : month;
      }

      return month + "." + year;
    };

    vm.toggleList = function() {
      vm.isListExpanded = !vm.isListExpanded;
      $rootScope.$emit("toggle-list", vm.isListExpanded);
    };

    vm.goToSearch = function() {
      if (isAnOverlayGroup) {
        Search.setActiveAllLayers();
      } else {
        Search.setActiveLayers(realState);
      }

      vm.goTo("search");
    };

    init();

    return vm;
  });
