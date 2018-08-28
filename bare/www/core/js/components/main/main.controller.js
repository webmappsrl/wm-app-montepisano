angular.module('webmapp')

    .controller('MainController', function MainController(
        $cordovaDeeplinks,
        $cordovaSocialSharing,
        $ionicModal,
        $ionicPlatform,
        $ionicPopup,
        $ionicSideMenuDelegate,
        $ionicScrollDelegate,
        $rootScope,
        $scope,
        $state,
        $translate,
        Auth,
        Communication,
        CONFIG,
        GeolocationService,
        MapService,
        Model,
        Utils
    ) {
        var vm = {},
            registeredEvents = [];

        var overlaysGroupMap = Model.getOverlaysGroupMap(),
            overlayMap = Model.getOverlaysMap();

        var previousBounds = null;

        var hideExpanderInDetails = CONFIG.OPTIONS.hideExpanderInDetails;

        var shareScope = $rootScope.$new(),
            shareModal;

        vm.geolocationState = {
            isActive: false,
            isLoading: false,
            isFollowing: false,
            isRotating: false
        };
        vm.navigation = {
            state: {
                isActive: false,
                isPaused: false
            },
            stats: {
                time: 0,
                distance: 0,
                averageSpeed: 0,
                currentSpeed: 0
            },
            resetStats: function () {
                vm.navigation.stats.time = 0;
                vm.navigation.stats.distance = 0;
                vm.navigation.stats.averageSpeed = 0;
                vm.navigation.stats.currentSpeed = 0;
            }
        };
        vm.navigationInterval = null;

        vm.userData = {};

        vm.speedTextType = 'average';

        if (CONFIG.MAIN && CONFIG.MAIN.NAVIGATION && CONFIG.MAIN.NAVIGATION.defaultSpeedType && CONFIG.MAIN.NAVIGATION.defaultSpeedType === 'current') {
            vm.speedTextType = 'current';
        }
        if (CONFIG.NAVIGATION && CONFIG.NAVIGATION.defaultSpeedType && CONFIG.NAVIGATION.defaultSpeedType === 'current') {
            vm.speedTextType = 'current';
        } else {
            vm.speedTextType = 'average';
        }

        Utils.createModal('core/js/modals/shareModal.html', {
            backdropClickToClose: true,
            hardwareBackButtonClose: true
        }, shareScope)
            .then(function (modal) {
                shareModal = modal;
            });

        shareScope.vm = {};
        shareScope.vm.textblock = '';
        shareScope.vm.emailblock = '';

        shareScope.vm.hide = function () {
            if (!shareScope.shareInProgress) {
                shareModal.hide();
            }
        };

        shareScope.vm.sendText = function () {
            var currentRequest;
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if (shareScope.vm.emailblock === '' || !re.test(shareScope.vm.emailblock)) {
                $ionicPopup.alert({
                    title: $translate.instant("ATTENZIONE"),
                    template: $translate.instant("Inserisci un'email valida per continuare")
                });
            } else {
                shareScope.vm.sendInProgress = true;
                currentRequest = Communication.post(CONFIG.REPORT.apiUrl, {
                    email: shareScope.vm.emailblock,
                    to: CONFIG.REPORT.defaultEmail,
                    content: shareScope.vm.textblock,
                    lat: vm.centerCoords.lat,
                    lng: vm.centerCoords.lng,
                    phone: shareScope.vm.phoneNumber,
                    type: 'email'
                });

                currentRequest
                    .then(function () {
                        shareScope.vm.sendInProgress = false;
                        shareScope.vm.sendSuccess = true;

                        setTimeout(function () {
                            shareModal.hide();
                        }, 1000);
                    },
                        function (error) {
                            $ionicPopup.alert({
                                title: $translate.instant("ATTENZIONE"),
                                template: $translate.instant("Si è verificato un errore di connessione, riprova più tardi")
                            });
                            shareScope.vm.sendInProgress = false;
                        });
            }
        };

        vm.hideDeactiveCentralPointer = CONFIG.OPTIONS.hideDeactiveCentralPointer;

        vm.isCoordsBlockExpanded = true;

        vm.navigationAvailable = false;
        vm.isNavigating = false;
        vm.isPaused = false;
        vm.stopNavigationUrlParams = {
            parentId: null,
            id: null
        };

        vm.routeId = CONFIG.routeID ? CONFIG.routeID : 0;

        if (!Date.now) {
            Date.now = function () {
                return new Date().getTime();
            };
        }

        if (CONFIG.NAVIGATION && CONFIG.NAVIGATION.activate && !Utils.isBrowser()) {
            vm.navigationAvailable = true;
        }

        vm.heading = 0;
        vm.colors = CONFIG.MAIN ? CONFIG.MAIN.STYLE : CONFIG.STYLE;
        vm.hideHowToReach = CONFIG.OPTIONS.hideHowToReach;
        vm.useExandMapInDetails = CONFIG.OPTIONS.useExandMapInDetails;
        vm.showLocate = !CONFIG.MAP.hideLocationControl && !Utils.isBrowser() ||
            Utils.isBrowser && !CONFIG.MAP.hideLocationControl && window.location.protocol === "https:";

        vm.viewTitle = $translate.instant("MAPPA");
        vm.centerCoords = CONFIG.MAP.showCoordinatesInMap ? MapService.getCenterCoordsReference() : null;
        vm.centerCoordsUTM32 = CONFIG.MAP.showCoordinatesInMap ? MapService.getCenterCoordsUTM32Reference() : null;
        vm.useUTM32 = false;
        vm.useShare = CONFIG.OPTIONS.allowCoordsShare || (CONFIG.MAIN && CONFIG.MAIN.OPTIONS.allowCoordsShare);
        vm.useReport =
            (CONFIG.REPORT && (
                (CONFIG.REPORT.email && CONFIG.REPORT.email.apiUrl && CONFIG.REPORT.email.default) ||
                (CONFIG.REPORT.sms && CONFIG.REPORT.sms.default))) ||
            (CONFIG.MAIN && CONFIG.MAIN.REPORT && (
                (CONFIG.MAIN.REPORT.email && CONFIG.MAIN.REPORT.email.apiUrl && CONFIG.MAIN.REPORT.email.default) ||
                (CONFIG.MAIN.REPORT.sms && CONFIG.MAIN.REPORT.sms.default)));

        vm.showRightMenu = false;
        vm.filterIcon = CONFIG.OPTIONS.filterIcon;

        $scope.$watch(function () {
            return $ionicSideMenuDelegate.isOpenLeft();
        },
            function (isOpen) {
                if (isOpen) {
                    vm.showRightMenu = false;
                }
            });

        if (!CONFIG.NAVIGATION.enableTrackRecording) {
            var saveModalScope = $rootScope.$new();
            var saveModal = {};

            saveModalScope.vm = {};
            saveModalScope.vm.operation = 'salva';
            saveModalScope.vm.COLORS = vm.colors;

            $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/saveRecordModal.html', {
                scope: saveModalScope,
                animation: 'slide-in-up',
                hardwareBackButtonClose: false,
                backdropClickToClose: false
            }).then(function (modalObj) {
                saveModal = modalObj;
            });

            saveModalScope.vm.hide = function () {
                MapService.removeUserPolyline();
                saveModal.hide();
            };
            saveModalScope.vm.title = "";
            saveModalScope.vm.description = "";

            saveModalScope.submitData = function () {

                var info = {
                    name: saveModalScope.vm.title,
                    description: saveModalScope.vm.description
                };
                MapService.saveUserPolyline(info);
                MapService.removeUserPolyline();
                saveModal.hide();

            }

            registeredEvents.push(
                $rootScope.$on('recordingState-changed', function (e, value) {
                    if (value.isActive == false && MapService.getUserPolyline() !== null && MapService.getUserPolyline().getLatLngs().length >= 2) {
                        console.log(MapService.getUserPolyline());
                        saveModalScope.vm.title = "";
                        saveModalScope.vm.description = "";
                        saveModalScope.vm.operation = "salva";
                        saveModalScope.vm.featureId = "";
                        saveModal.show();
                    }
                })
            );
        }

        vm.openFilters = function () {
            vm.showRightMenu = false;
            $rootScope.$emit("openFilters");
        }

        vm.shareCurrentPosition = function ($event) {
            $event.stopPropagation();

            if (!navigator.onLine) {
                $ionicPopup.alert({
                    title: $translate.instant("ATTENZIONE"),
                    template: $translate.instant("Questa funzionalità è disponibile solo con una connessione attiva. Controlla la tua connessione e riprova")
                });
                return;
            }

            if (!vm.useShare) {
                return;
            }

            var title = CONFIG.MAIN ? CONFIG.MAIN.OPTIONS.title + ' ' + CONFIG.OPTIONS.title : CONFIG.OPTIONS.title;
            title = Utils.decodeHtml(title);

            shareOptions = {
                message: $translate.instant('Ciao. Sto usando') + ' ' + title + '. ' + $translate.instant("Dai un'occhiata a questo posto"),
                mailSubject: title,
                baseUrl: "http://www.google.com/maps/place/"
            };

            if (prevLatLong && (distanceInMeters(prevLatLong.lat, prevLatLong.long, vm.centerCoords.lat, vm.centerCoords.lng) > 40)) {
                $ionicPopup.confirm({
                    title: $translate.instant("ATTENZIONE"),
                    template: $translate.instant("La posizione che stai per condividere non è la tua posizione attuale ma la posizione segnata dalla croce nel centro della mappa. Per condividere la tua posizione attuale assicurati di avere il centro della mappa vicino alla tua posizione. Vuoi condividere comunque queste coordinate?")
                }).then(function (res) {
                    if (res) {
                        $cordovaSocialSharing
                            .share(
                                shareOptions.message,
                                shareOptions.mailSubject,
                                undefined,
                                shareOptions.baseUrl +
                                vm.centerCoords.lat + ',' +
                                vm.centerCoords.lng)
                            .then(function (result) {
                                // Success!
                            }, function (err) {
                                console.err(err);
                            });
                    }
                });
            } else {
                $cordovaSocialSharing
                    .share(
                        shareOptions.message,
                        shareOptions.mailSubject,
                        undefined,
                        shareOptions.baseUrl +
                        vm.centerCoords.lat + ',' +
                        vm.centerCoords.lng)
                    .then(function (result) {
                        // Success!
                    }, function (err) {
                        console.err(err);
                    });
            }
        };

        var sendSMS = function (text) {
            if (CONFIG.REPORT.sms || (CONFIG.MAIN && CONFIG.MAIN.REPORT.sms)) {
                var smsTo = '';

                if (CONFIG.REPORT && CONFIG.REPORT.sms && CONFIG.REPORT.sms.default) {
                    smsTo = CONFIG.REPORT.sms.default;
                } else if (CONFIG.MAIN && CONFIG.MAIN.REPORT && CONFIG.MAIN.REPORT.sms && CONFIG.MAIN.REPORT.sms.default) {
                    smsTo = CONFIG.MAIN.REPORT.sms.default;
                }

                if (smsTo !== '') {
                    $cordovaSocialSharing
                        .shareViaSMS(text, smsTo)
                        .then(function (result) {
                            return;
                        }, function (err) {
                            return;
                        });
                }
            }
        };

        vm.reportCurrentPosition = function ($event) {
            if (!vm.gpsActive) {
                checkGPS();
                return;
            }

            if (vm.isOutsideBoundingBox) {
                $ionicPopup.alert({
                    title: $translate.instant("ATTENZIONE"),
                    template: $translate.instant("Sembra che tu sia fuori dai limiti della mappa: la richiesta di aiuto non è disponibile.")
                });
                return;
            }

            if (!prevLatLong) {
                $ionicPopup.alert({
                    title: $translate.instant("ATTENZIONE"),
                    template: $translate.instant("Devi essere localizzato per segnalare la tua posizione")
                });
                return;
            }

            $event.stopPropagation();
            text = "ALERT MSG - Myeasyroute user: " +
                vm.userData.user_email + " nome: " + vm.userData.first_name + " cognome: " + vm.userData.last_name + " https://www.google.com/maps/search/?api=1&query=" +
                prevLatLong.lat + ',' +
                prevLatLong.long;

            if (CONFIG.REPORT.email || (CONFIG.MAIN && CONFIG.MAIN.REPORT.email)) {
                $ionicPopup.confirm({
                    title: $translate.instant("ATTENZIONE"),
                    template: $translate.instant("Cliccando su OK invii una richiesta di aiuto al numero di assistenza.")
                })
                    .then(function (res) {
                        if (res) {
                            var emailTo = '',
                                url = '';

                            if (CONFIG.REPORT && CONFIG.REPORT.email && CONFIG.REPORT.email.default) {
                                emailTo = CONFIG.REPORT.email.default;
                            } else if (CONFIG.MAIN && CONFIG.MAIN.REPORT && CONFIG.MAIN.REPORT.email && CONFIG.MAIN.REPORT.email.default) {
                                emailTo = CONFIG.MAIN.REPORT.email.default;
                            }

                            if (CONFIG.REPORT && CONFIG.REPORT.email && CONFIG.REPORT.email.apiUrl) {
                                url = CONFIG.REPORT.email.apiUrl;
                            } else if (CONFIG.MAIN && CONFIG.MAIN.REPORT && CONFIG.MAIN.REPORT.email && CONFIG.MAIN.REPORT.email.apiUrl) {
                                url = CONFIG.MAIN.REPORT.email.apiUrl;
                            }

                            var app = CONFIG.OPTIONS.title;
                            if (CONFIG.MAIN) {
                                app = CONFIG.MAIN.OPTIONS.title + " - " + app;
                            }

                            if (emailTo !== '' && url !== '') {
                                var currentRequest = Communication.callAPI(url, {
                                    email: vm.userData.user_email,
                                    firstName: vm.userData.first_name,
                                    lastName: vm.userData.last_name,
                                    to: emailTo,
                                    lat: prevLatLong.lat,
                                    lng: prevLatLong.long,
                                    type: "alert",
                                    app: app
                                });

                                currentRequest
                                    .then(function () {
                                        return;
                                    },
                                        function (error) {
                                            return;
                                        });
                            }
                            sendSMS(text);
                        }
                    });
            } else {
                $ionicPopup.confirm({
                    title: $translate.instant("ATTENZIONE"),
                    template: $translate.instant("Cliccando su OK invii una richiesta di aiuto al numero di assistenza.")
                })
                    .then(function (res) {
                        if (res) {
                            sendSMS(text);
                        }
                    });
            }
        };

        vm.centerOnMe = function () {
            if (!GeolocationService.isActive()) {
                GeolocationService.enable();
            } else {
                GeolocationService.switchState();
            }
        };

        vm.goBack = function () {
            if (history.length > 1) {
                history.back();
            } else {
                Utils.goTo('/');
            }
        };

        vm.returnToMap = function () {
            // vm.isNavigable = false;
            vm.toggleMap();
            return;
            console.log("return")
            if ($state.params.parentId) {
                MapService.setFilter($state.params.parentId.replace(/_/g, " "), true);
            }
            if (!CONFIG.NAVIGATION.enableTrackRecording && MapService.getUserPolyline() !== null) {
                vm.isNavigable = false;
            }
            vm.goToMap();
        };

        vm.goToMap = function () {
            Utils.goTo('/');
        };

        vm.expandCoords = function () {
            vm.isCoordsBlockExpanded = !vm.isCoordsBlockExpanded;
        };

        vm.switchCoords = function () {
            if (!CONFIG.OPTIONS.UTM32Enabled) {
                return;
            }

            vm.useUTM32 = !vm.useUTM32;
        }

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

        vm.toggleMap = function () {
            vm.isMapPage = !vm.isMapPage;
            vm.mapView = vm.isMapPage;
            // vm.isNavigable = false;
            setTimeout(function () {
                MapService.adjust();
            }, 350);
            MapService.adjust();
            $rootScope.$emit('expand-map', vm.isMapPage);
        };

        var navigationIntervalFunction = function () {
            GeolocationService.getStats()
                .then(function (stats) {
                    vm.navigation.stats = stats;
                    Utils.forceDigest();
                });
        };

        vm.startNavigation = function (record) {
            var startRecording = function () {
                GeolocationService.startRecording(vm.stopNavigationUrlParams ? vm.stopNavigationUrlParams : false, record ? true : false);
                GeolocationService.switchState({
                    isRotating: true,
                    isFollowing: true
                });
            };

            vm.showRightMenu = false;
            if (!record) {
                vm.stopNavigationUrlParams.parentId = $rootScope.currentParams.parentId;
                vm.stopNavigationUrlParams.id = $rootScope.currentParams.id;
            } else {
                vm.stopNavigationUrlParams.parentId = null;
                vm.stopNavigationUrlParams.id = null;
            }

            vm.navigationInterval = setInterval(navigationIntervalFunction, 999);

            if (GeolocationService.isActive()) {
                startRecording();
            } else {
                GeolocationService.enable()
                    .then(startRecording);
            }

            window.plugins.insomnia.keepAwake();
            setTimeout(function () {
                MapService.adjust();
            }, 1000);

            Utils.goTo('/');
        };

        vm.pauseNavigation = function () {
            GeolocationService.pauseRecording();
            GeolocationService.switchState({
                isFollowing: false,
                isRotating: false
            });
            clearInterval(vm.navigationInterval);
            window.plugins.insomnia.allowSleepAgain();
        };

        vm.resumeNavigation = function () {
            GeolocationService.resumeRecording();
            GeolocationService.switchState({
                isFollowing: true,
                isRotating: true
            });
            vm.navigationInterval = setInterval(navigationIntervalFunction, 1000);
            window.plugins.insomnia.keepAwake();
            MapService.adjust();
        };

        vm.stopNavigation = function () {
            GeolocationService.stopRecording();
            clearInterval(vm.navigationInterval);
            vm.navigation.resetStats();
            MapService.adjust();
            vm.isNavigating = false;
            window.plugins.insomnia.allowSleepAgain();
        };

        vm.toggleSpeedText = function () {
            switch (vm.speedTextType) {
                case 'current':
                    vm.speedTextType = 'average';
                    break;
                case 'average':
                default:
                    vm.speedTextType = 'current';
                    break;
            }

            Utils.forceDigest();
        };

        vm.formatTime = function (time) {
            if (!time) {
                return "0:00";
            }

            var hours = 0,
                minutes = 0,
                seconds = 0;

            time = (time - (time % 1000)) / 1000;
            seconds = time % 60;
            minutes = ((time - seconds) / 60) % 60;
            hours = ((time - seconds - minutes * 60) / 3600) % 24;

            if (hours > 0) {
                return ("0" + hours).slice(-2) + ':' + ("0" + minutes).slice(-2) + ':' + ("0" + seconds).slice(-2);
            } else {
                return ("0" + minutes).slice(-2) + ':' + ("0" + seconds).slice(-2);
            }
        };

        vm.formatDistance = function (distance) {
            return distance ? ((distance / 1000).toFixed(1) + 'km') : '0km';
        };

        vm.formatSpeed = function (speed) {
            return speed ? (speed.toFixed(0) + "km/h") : '0km/h';
        };

        registeredEvents.push(
            $scope.$on('$stateChangeStart', function (e, dest) {
                vm.showRightMenu = false;
                if ((dest.name === 'app.main.detaillayer' ||
                    dest.name === 'app.main.detailevent' ||
                    dest.name === 'app.main.detailulayer') &&
                    previousBounds === null) {
                    previousBounds = MapService.getBounds();
                }
            })
        );

        registeredEvents.push(
            $scope.$on('$stateChangeSuccess', function () {
                var currentState = $rootScope.currentState.name,
                    realState;

                vm.layerState = false;

                if (currentState !== 'app.main.detaillayer' &&
                    currentState !== 'app.main.detailevent' &&
                    currentState !== 'app.main.detailulayer' &&
                    previousBounds) {
                    setTimeout(function () {
                        // MapService.fitBounds(previousBounds);
                        previousBounds = null;
                    }, 1250);
                }

                if (currentState !== 'app.main.detaillayer' && $rootScope.track) {
                    delete $rootScope.track;
                }

                if (!$rootScope.stateCounter) {
                    $rootScope.stateCounter = 1;
                } else {
                    $rootScope.stateCounter++;
                }

                vm.isWelcomePage = currentState === 'app.main.welcome';
                vm.isSearchPage = currentState === 'app.main.search';
                vm.isMapPage = currentState === 'app.main.map';
                vm.isMapModeInSearch = false;
                vm.hasShadow = false;
                vm.extendShadow = false;
                vm.detail = false;

                if (!$rootScope.first) {
                    $rootScope.first = true;
                } else {
                    if (!$rootScope.backAllowed) {
                        $rootScope.backAllowed = true;
                    }
                }

                // TODO: find a way to slow down the animation when the state change
                MapService.adjust();
                MapService.resetLoading();
                MapService.closePopup();

                setTimeout(function () {
                    MapService.adjust();
                    setTimeout(function () {
                        MapService.adjust();
                    }, 650);
                }, 650);

                vm.hideMap = false;
                vm.mapView = false;

                if (currentState === 'app.main.map') {
                    vm.mapView = true;
                    vm.hideExpander = true;
                    setTimeout(function () {
                        if (vm.stopNavigationUrlParams.parentId && vm.stopNavigationUrlParams.id && MapService.getUserPolyline() === null) {
                            MapService.showPathAndRelated(vm.stopNavigationUrlParams);
                        }
                    }, 50);
                } else if (currentState === 'app.main.popup') {
                    vm.mapView = true;
                    vm.hideExpander = true;
                } else if (currentState === 'app.main.events') {
                    MapService.showEventsLayer();
                    vm.hasShadow = true;
                } else if (currentState === 'app.main.welcome') {
                    // TODO: show nothing on the map
                } else if (currentState === 'app.main.layer') {
                    realState = $rootScope.currentParams.id.replace(/_/g, ' ');
                    vm.layerState = true;

                    if (typeof overlayMap[realState] !== 'undefined' ||
                        typeof overlaysGroupMap[realState] !== 'undefined') {

                        setTimeout(function () {
                            if (vm.layerState) {
                                MapService.activateLayer(realState, false, false);
                            }
                        }, 50);
                    }
                } else if (currentState === 'app.main.detaillayer') {
                    if (MapService.isAPOILayer($rootScope.currentParams.parentId.replace(/_/g, ' '))) {
                        vm.detail = true;
                    }

                    vm.hideExpander = hideExpanderInDetails;
                } else if (currentState === 'app.main.detailtaxonomy') {
                    vm.hideExpander = true;
                    vm.detail = true;
                    vm.hasShadow = true;
                    vm.extendShadow = true;
                } else if (currentState === 'app.main.detailevent') {
                    vm.hasShadow = true;
                } else if (currentState === 'app.main.detailulayer') {
                    MapService.resetUtfGridLayers();
                    vm.hideExpander = true;
                } else if (currentState === 'app.main.coupons' ||
                    currentState === 'app.main.packages' ||
                    currentState === 'app.main.route' ||
                    currentState === 'app.main.taxonomy' ||
                    currentState === 'app.main.languages' ||
                    currentState === 'app.main.webmappInternal' ||
                    currentState === 'app.main.attributionInternal') {
                    vm.hideMap = true;
                    vm.hasShadow = true;
                    vm.extendShadow = true;
                } else if (currentState === 'app.main.offline' ||
                    currentState === 'app.main.search' ||
                    Model.isAPage(currentState)) {
                    vm.hideMap = true;
                }

                setTimeout(function () {
                    $ionicScrollDelegate.$getByHandle('mainScroll').scrollTop();
                    $ionicScrollDelegate.$getByHandle('mainScroll').resize();
                });

                MapService.initialize();
            })
        );

        registeredEvents.push(
            $rootScope.$on('rightMenuClick', function () {
                vm.showRightMenu = !vm.showRightMenu;
            })
        );

        registeredEvents.push(
            $rootScope.$on('toggle-map-in-search', function (e, value) {
                vm.isMapModeInSearch = value;
                setTimeout(function () {
                    MapService.adjust();
                }, 350);
            })
        );

        registeredEvents.push(
            $rootScope.$on('toggle-map-from-detail', function () {
                vm.toggleMap();
            })
        );

        registeredEvents.push(
            $rootScope.$on('toggle-list', function (e, value) {
                vm.hideMap = value;
                setTimeout(function () {
                    MapService.adjust();
                    angular.element(window).triggerHandler('resize');
                }, 350);
            })
        );

        registeredEvents.push(
            $rootScope.$on('item-navigable', function (e, value) {
                vm.isNavigable = value;
                Utils.forceDigest();
            })
        );

        registeredEvents.push(
            $rootScope.$on('geolocationState-changed', function (e, value) {
                vm.geolocationState = value;
                Utils.forceDigest();
            })
        );

        registeredEvents.push(
            $rootScope.$on('heading-changed', function (e, value) {
                vm.heading = value;
                Utils.forceDigest();
            })
        );

        registeredEvents.push(
            $rootScope.$on('recordingState-changed', function (e, value) {
                if (value.currentTrack) {
                    vm.stopNavigationUrlParams = {
                        id: value.currentTrack.id,
                        parentId: value.currentTrack.parentId
                    };

                    vm.navigationInterval = setInterval(navigationIntervalFunction, 999);
                    window.plugins.insomnia.keepAwake();
                }

                if (vm.navigation.state.isActive !== value.isActive) {
                    vm.navigation.state.isActive = value.isActive;
                    $rootScope.$emit('is-navigating', vm.navigation.state.isActive);
                    $rootScope.isNavigating = vm.navigation.state.isActive;
                    if (vm.navigation.state.isActive) {
                        vm.isNavigable = false;
                    } else {
                        if (vm.stopNavigationUrlParams.parentId && vm.stopNavigationUrlParams.id) {
                            vm.isNavigable = true;
                            var url = 'layer/' + vm.stopNavigationUrlParams.parentId + '/' + vm.stopNavigationUrlParams.id;
                            vm.stopNavigationUrlParams = {
                                parentId: null,
                                id: null
                            };
                            Utils.goTo(url);
                        }
                    }
                }
                if (vm.navigation.state.isPaused !== value.isPaused) {
                    vm.navigation.state.isPaused = value.isPaused;
                }
            })
        );

        $ionicPlatform.ready(function () {
            vm.userData = Auth.getUserData();
            if (CONFIG.MAIN || !CONFIG.MULTIMAP) {
                if (!GeolocationService.isActive()) {
                    GeolocationService.enable();
                }
                if (window !== top) {
                    MapService.disableWheelZoom();
                }
            }

            // Note: route's first argument can take any kind of object as its data,
            // and will send along the matching object if the route matches the deeplink

            //ionic cordova plugin add ionic-plugin-deeplinks --variable URL_SCHEME=test --variable DEEPLINK_SCHEME=https --variable DEEPLINK_HOST=api.webmapp.it --variable ANDROID_PATH_PREFIX=/
            $cordovaDeeplinks.route({
                // '/languages': { target: 'languages' },
                // '/home': { target: 'home' },
                // '/packages': { target: 'packages' },
                '/routeDownload/:id': { target: 'route/', parent: 'packages' },
                '/route/:id': { target: 'route/', parent: 'packages' }
            }).subscribe(function (match) {
                setTimeout(function () {
                    if (match.$route.parent) {
                        Utils.goTo(match.$route.parent);
                        setTimeout(function () {
                            if (match.$link.path === '/routeDownload/' + match.$args.id) {
                                $rootScope.routeDownload = true;
                            }
                            Utils.goTo(match.$route.target + match.$args.id);
                        }, 10);
                    }
                    else {
                        Utils.goTo(match.$route.target);
                    }
                }, 20);
            }, function (nomatch) {
                console.warn('No match', nomatch);
            });
        });

        registeredEvents.push(
            $scope.$on('$destroy', function () {
                for (var i in registeredEvents) {
                    registeredEvents[i]();
                }
                delete registeredEvents;
            })
        );

        return vm;
    });