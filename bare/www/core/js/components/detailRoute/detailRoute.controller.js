angular.module('webmapp')

.controller('DetailRouteController', function DetailRouteController(
    $state,
    $scope,
    $rootScope,
    $sce,
    $ionicModal,
    $ionicSlideBoxDelegate,
    MapService,
    Model,
    Utils,
    CONFIG,
    $translate
) {
    var vm = {},
        current = $state.current || {},
        params = $state.params || {},
        currentLang = $translate.preferredLanguage();

    var modalScope = $rootScope.$new(),
        modal = {},
        modalImage = {};

    var isOnline = false,
        isBrowser = vm.isBrowser = Utils.isBrowser();

    modalScope.vm = {};
    modalScope.parent = vm;

    vm.avoidModal = CONFIG.OPTIONS.avoidModalInDetails;
    vm.colors = CONFIG.STYLE;
    vm.imageUrl = CONFIG.OFFLINE.imagesUrl;
    vm.goBack = Utils.goBack;

    $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/imagesModal.html', {
        scope: modalScope,
        animation: 'slide-in-up'
    }).then(function(modalObj) {
        modalImage = modalObj;
    });

    vm.openImageModal = function() {
        modalImage.show();
    };

    modalScope.vm.hide = function() {
        modalImage && modalImage.hide();
    };

    vm.packages = JSON.parse(localStorage.$wm_packages);

    var getTranslatedContent = function(id) {

        return $.getJSON(CONFIG.COMMUNICATION.baseUrl + CONFIG.COMMUNICATION.wordPressEndpoint + 'route/' + id, function (data) {
            vm.title = data.title.rendered;
            vm.description = data.content.rendered;
            vm.gallery = data.n7webmap_route_media_gallery;
            return data;
        }).fail(function () {
            console.error('translation retrive error');
            return 'translation retrive error';
        });
    };

    var getRoute = function(id) {
        for (var i = 0; i < vm.packages.length; i++) {
            if (vm.packages[i].id == id) {
                if (currentLang !== CONFIG.LANGUAGES.actual) {
                    
                    for (var lang in vm.packages[i].wpml_translations) {
                        if (vm.packages[i].wpml_translations[lang].locale.substring(0, 2) === currentLang) {
                            getTranslatedContent(vm.packages[i].wpml_translations[lang].id);
                            break;
                        }
                    }
                    
                }
                return vm.packages[i];
            }
        }
    };

    var routeDetail = getRoute(params.id);

    if (routeDetail) {
        vm.title = routeDetail.title.rendered;
        vm.description = routeDetail.content.rendered;
        vm.gallery = routeDetail.n7webmap_route_media_gallery;
        if (vm.gallery && vm.gallery[0] && vm.gallery[0].sizes) {
            vm.featureImage = vm.gallery[0].sizes.medium_large;
        }
        vm.codeRoute = routeDetail.n7webmapp_route_cod;
        vm.difficulty = routeDetail.n7webmapp_route_difficulty;
    }

    vm.imageGallery = [];
    for (var g = 0; g < vm.gallery.length; g++) {
        vm.imageGallery.push(vm.gallery[g].sizes.medium_large);
    }

    vm.hasGallery = vm.imageGallery.length > 0;

    vm.showLeft = function() {
        if (!vm.hasGallery) {
            return false;
        }

        if ($ionicSlideBoxDelegate._instances &&
            $ionicSlideBoxDelegate._instances[0]) {
            return $ionicSlideBoxDelegate._instances[0].currentIndex() !== 0;
        }
    };

    vm.showRight = function() {
        if (!vm.hasGallery) {
            return false;
        }

        if (vm.imageGallery.length === 0) {
            return false;
        }

        if ($ionicSlideBoxDelegate._instances &&
            $ionicSlideBoxDelegate._instances[0]) {
            return $ionicSlideBoxDelegate._instances[0].currentIndex() !== vm.imageGallery.length - 1;
        }
    };

    modalScope.vm.nextImage = function() {
        if ($ionicSlideBoxDelegate._instances &&
            $ionicSlideBoxDelegate._instances[0]) {
            $ionicSlideBoxDelegate._instances[0].next();
        }
    };

    modalScope.vm.prevImage = function() {
        if ($ionicSlideBoxDelegate._instances &&
            $ionicSlideBoxDelegate._instances[0]) {
            $ionicSlideBoxDelegate._instances[0].previous();
        }
    };

    return vm;
});