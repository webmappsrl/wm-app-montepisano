angular
  .module("webmapp")

  .controller(
    "HomeController",
    function HomeController(
      $translate,
      $rootScope,
      $window,
      CONFIG,
      Search,
      Utils
    ) {
      var vm = {};

      vm.activities = {};
      vm.columns = 1;
      vm.rows = 1;
      vm.appTitle = CONFIG.OPTIONS.title;

      vm.currentLang = $translate.preferredLanguage()
        ? $translate.preferredLanguage()
        : "it";
      vm.defaultLang = "it";
      vm.columns = 2;
      vm.rows = 2;

      vm.colors = CONFIG.STYLE;
      vm.height = $window.innerHeight;

      vm.searchString = "";

      vm.goToSearchByString = function () {
        $rootScope.searchQuery = vm.searchString;
        $rootScope.searchLayers = [];
        Utils.goTo("search");
      };

      vm.goToSearchByCategory = function (id) {
        Utils.goTo("layer/" + id);
      };

      vm.types = [];

      for (let i in CONFIG.OVERLAY_LAYERS) {
        if (
          !!CONFIG.OVERLAY_LAYERS[i] &&
          !!CONFIG.OVERLAY_LAYERS[i].geojsonUrl &&
          !!CONFIG.OVERLAY_LAYERS[i].languages
        ) {
          vm.types.push(CONFIG.OVERLAY_LAYERS[i]);
          vm.types[vm.types.length - 1].name =
            CONFIG.OVERLAY_LAYERS[i].languages;
        }
      }

      return vm;
    }
  );
