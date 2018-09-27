angular.module('webmapp')

    .config(function (
        $stateProvider,
        $httpProvider,
        $urlRouterProvider,
        $ionicConfigProvider,
        CONFIGProvider) {
        var basePath = templateBasePath || '';
        // Cache each view in DOM
        // $ionicConfigProvider.views.forwardCache(true);

        // Disable transitions
        // $ionicConfigProvider.views.transition('none');
        // Disable swipe back on iOS
        $ionicConfigProvider.views.swipeBackEnabled(false);
        //Enable cross domain calls
        $httpProvider.defaults.useXDomain = true;
        $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
        //Remove the header used to identify ajax call  that would prevent CORS from working
        delete $httpProvider.defaults.headers.common['X-Requested-With'];

        // TODO: add single template overwrite (!)

        config = CONFIGProvider.$get();

        $stateProvider
            .state('app', {
                abstract: true,
                templateUrl: basePath + 'js/components/menu/menu.html'
            })
            .state('app.main', {
                abstract: true,
                views: {
                    'main-content': {
                        templateUrl: basePath + 'js/components/main/main.html'
                    }
                }
            })
            .state('app.main.map', {
                url: '/',
                views: {
                    'inception-top': {
                        templateUrl: basePath + 'js/components/mapView/mapView.html'
                    }
                }
            })
            .state('app.main.poipopup', {
                url: '/poi/:id/:zoom',
                views: {
                    'inception-top': {
                        templateUrl: basePath + 'js/components/popupOpener/popupOpener.html'
                    }
                }
            })
            .state('app.main.trackpopup', {
                url: '/track/:id',
                views: {
                    'inception-top': {
                        templateUrl: basePath + 'js/components/popupOpener/popupOpener.html'
                    }
                }
            })
            .state('app.main.layer', {
                url: '/layer/:id',
                views: {
                    'inception-top': {
                        templateUrl: basePath + 'js/components/list/layerList.html'
                    }
                }
            })
            .state('app.main.pages', {
                url: '/pages/:id',
                views: {
                    'inception-top': {
                        templateUrl: basePath + 'js/components/list/pageList.html'
                    }
                }
            })
            .state('app.main.detaillayer', {
                url: '/layer/:parentId/:id',
                views: {
                    'inception-top': {
                        templateUrl: basePath + 'js/components/details/details.html'
                    }
                }
            })
            .state('app.main.webmappInternal', {
                url: '/page/webmappInternal',
                views: {
                    'inception-top': {
                        templateUrl: basePath + 'js/components/webmapp/webmapp.html'
                    }
                }
            })
            .state('app.main.attributionInternal', {
                url: '/page/attributionInternal',
                views: {
                    'inception-top': {
                        templateUrl: basePath + 'js/components/attribution/attribution.html'
                    }
                }
            });

        if (config.SEARCH && config.SEARCH.active) {
            $stateProvider
                .state('app.main.search', {
                    url: '/search',
                    views: {
                        'inception-top': {
                            templateUrl: basePath + 'js/components/search/search.html'
                        }
                    }
                });
        }

        if (config.PAGES) {
            for (var i = 0; i < config.PAGES.length; i++) {
                if (!config.PAGES[i].isCustom) {
                    if (config.PAGES[i].type === "packages") {
                        $stateProvider
                            .state('app.main.packages', {
                                url: '/page/packages/:id',
                                views: {
                                    'inception-top': {
                                        templateUrl: basePath + 'js/components/packages/packages.html'
                                    }
                                }
                            })
                            .state('app.main.route', {
                                url: '/route/:id',
                                views: {
                                    'inception-top': {
                                        templateUrl: basePath + 'js/components/detailRoute/detailRoute.html'
                                    }
                                }
                            });
                    } else if (config.PAGES[i].type === "taxonomy") {
                        $stateProvider
                            .state('app.main.taxonomy', {
                                url: '/taxonomy/:id',
                                views: {
                                    'inception-top': {
                                        templateUrl: basePath + 'js/components/taxonomy/taxonomy.html'
                                    }
                                }
                            })
                            .state('app.main.detailtaxonomy', {
                                url: '/taxonomy/:parentId/:id',
                                views: {
                                    'inception-top': {
                                        templateUrl: basePath + 'js/components/detailTaxonomy/detailTaxonomy.html'
                                    }
                                }
                            });
                    } else {
                        $stateProvider
                            .state('app.main.' + config.PAGES[i].type, {
                                url: '/page/' + config.PAGES[i].type,
                                views: {
                                    'inception-top': {
                                        templateUrl: basePath + 'js/components/' + config.PAGES[i].type + '/' + config.PAGES[i].type + '.html'

                                    }
                                }
                            });
                    }
                } else {
                    $stateProvider
                        .state('app.main.' + config.PAGES[i].type, {
                            url: '/page/' + config.PAGES[i].type,
                            views: {
                                'inception-top': {
                                    templateUrl: basePath + 'js/components/' + 'custom' + '/' + 'custom' + '.html'
                                }
                            }
                        });
                }
            }
        }

        if (config.EXTRA) {
            if (config.EXTRA.events) {
                $stateProvider
                    .state('app.main.events', {
                        url: '/events',
                        views: {
                            'inception-top': {
                                templateUrl: basePath + 'js/components/list/eventList.html'
                            }
                        }
                    })
                    .state('app.main.detailevent', {
                        url: '/events/:id',
                        views: {
                            'inception-top': {
                                templateUrl: basePath + 'js/components/details/details.html'
                            }
                        }
                    });
            }
        }

        $urlRouterProvider.otherwise(config.OPTIONS.startUrl);

        // $locationProvider.html5Mode(true); Aggiungere $locationProvider ai parametri
    });
