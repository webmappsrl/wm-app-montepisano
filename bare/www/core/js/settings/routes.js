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
            .state('app.main.popup', {
                url: '/poi/:id/:zoom',
                views: {
                    'inception-top': {
                        templateUrl: basePath + 'js/components/popupOpener/popupOpener.html'
                    }
                }
            })
            .state('app.main.search', {
                url: '/search',
                views: {
                    'inception-top': {
                        templateUrl: basePath + 'js/components/search/search.html'
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
            .state('app.main.route', {
                url: '/route/:id',
                views: {
                    'inception-top': {
                        templateUrl: basePath + 'js/components/detailRoute/detailRoute.html'
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

        if (CONFIGProvider.PAGES) {
            for (var i = 0; i < CONFIGProvider.PAGES.length; i++) {
                if (!CONFIGProvider.PAGES[i].isCustom) {
                    if (CONFIGProvider.PAGES[i].type === "packages") {
                        $stateProvider
                            .state('app.main.packages', {
                                url: '/page/packages/:id',
                                views: {
                                    'inception-top': {
                                        templateUrl: basePath + 'js/components/packages/packages.html'
                                    }
                                }
                            });
                    } else {
                        $stateProvider
                            .state('app.main.' + CONFIGProvider.PAGES[i].type, {
                                url: '/page/' + CONFIGProvider.PAGES[i].type,
                                views: {
                                    'inception-top': {
                                        templateUrl: basePath + 'js/components/' + CONFIGProvider.PAGES[i].type + '/' + CONFIGProvider.PAGES[i].type + '.html'

                                    }
                                }
                            });
                    }
                } else {
                    $stateProvider
                        .state('app.main.' + CONFIGProvider.PAGES[i].type, {
                            url: '/page/' + CONFIGProvider.PAGES[i].type,
                            views: {
                                'inception-top': {
                                    templateUrl: basePath + 'js/components/' + 'custom' + '/' + 'custom' + '.html'
                                }
                            }
                        });
                }
            }
            // .state('app.main.welcome', {
            //     url: '/welcome',
            //     views: {
            //         'inception-top': {
            //             templateUrl: basePath + 'js/components/welcome/welcome.html'
            //         }, 
            //         'inception-bottom': {
            //             templateUrl: basePath + 'js/parts/bottom.html'
            //         }
            //     }
            // })
            // .state('app.main.card', {
            //     url: '/card',
            //     views: {
            //         'inception-top': {
            //             templateUrl: basePath + 'js/components/card/card.html'
            //         }
            //     }
            // })
        }

        if (CONFIGProvider.EXTRA) {
            if (CONFIGProvider.EXTRA.events) {
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

        $urlRouterProvider.otherwise(CONFIGProvider.OPTIONS.startUrl);

        // $locationProvider.html5Mode(true); Aggiungere $locationProvider ai parametri
    });