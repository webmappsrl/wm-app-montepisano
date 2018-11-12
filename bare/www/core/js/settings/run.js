angular.module('webmapp')
    .run(function (
        $ionicPlatform,
        $rootScope,
        $state,
        $translate,
        CONFIG,
        MapService,
        Offline,
        Utils) {
        $rootScope.COLORS = CONFIG.STYLE;
        $rootScope.OPTIONS = CONFIG.OPTIONS;
        $rootScope.backButtonPressed = false;

        if (CONFIG.ADVANCED_DEBUG) {
            (function () {
                var oLog = console.log,
                    oDebug = console.debug,
                    oInfo = console.info,
                    oWarn = console.warn,
                    oError = console.error;

                console.log = function (message) {
                    console.re.log(message);
                    oLog.apply(console, arguments);
                };
                console.debug = function (message) {
                    console.re.debug(message);
                    oDebug.apply(console, arguments);
                };
                console.info = function (message) {
                    console.re.info(message);
                    oInfo.apply(console, arguments);
                };
                console.warn = function (message) {
                    console.re.warn(message);
                    oWarn.apply(console, arguments);
                };
                console.error = function (message) {
                    console.re.error(message);
                    oError.apply(console, arguments);
                };
            })();
        }

        $ionicPlatform.ready(function () {
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }

            if (CONFIG.OPTIONS.warningMessageUrl) {
                var warningModalScope = $rootScope.$new(),
                    warningModal;

                Utils.createModal('core/js/modals/warningModal.html', {
                    backdropClickToClose: true,
                    hardwareBackButtonClose: false
                }, warningModalScope).then(function (modal) {
                    warningModal = modal;
                    warningModal.show();

                    warningModalScope.vm = {};
                    warningModalScope.vm.hide = function () {
                        warningModal.hide();
                    };

                    var updateWarningBody = function (url) {
                        $.get(url + "?ts=" + Date.now()).then(function (response) {
                            warningModalScope.vm.body = response;
                            MapService.setItemInLocalStorage("$wm_warningBody", JSON.stringify(warningModalScope.vm.body));
                        }, function () {
                            if (!warningModalScope.vm.body) {
                                warningModalScope.vm.hide();
                            }
                        });
                    };

                    MapService.getItemFromLocalStorage("$wm_warningBody").then(function (warning) {
                        warningModalScope.vm.body = JSON.parse(warning.data);
                        updateWarningBody(CONFIG.OPTIONS.warningMessageUrl);
                    }, function (err) {
                        updateWarningBody(CONFIG.OPTIONS.warningMessageUrl);
                    });
                });
            }
        });

        $ionicPlatform.registerBackButtonAction(function (e) {
            e.preventDefault();
            if ($state.current.name === 'app.main.map' && sessionStorage.$wm_doBack) {
                if ($rootScope.backButtonPressed) {
                    Offline.resetCurrentMapAndGoBack();
                }
                else {
                    $rootScope.backButtonPressed = true;
                    Utils.showToast($translate.instant("Premi di nuovo per uscire dall'itinerario"), 'bottom');

                    $rootScope.backButtonPressedTimeout = setTimeout(function () {
                        $rootScope.backButtonPressed = false;
                        Utils.hideToast();
                    }, 5000);
                }
            }
            else if ($state.current.name === 'app.main.map') {
                if ($rootScope.backButtonPressed) {
                    navigator.app.exitApp();
                }
                else {
                    $rootScope.backButtonPressed = true;
                    Utils.showToast($translate.instant("Premi di nuovo per chiudere l'applicazione"), 'bottom');

                    $rootScope.backButtonPressedTimeout = setTimeout(function () {
                        $rootScope.backButtonPressed = false;
                        Utils.hideToast();
                    }, 5000);
                }
            } else {
                navigator.app.backHistory();
            }
        }, 101);

        $rootScope.$on('$stateChangeStart', function (e, toState, toParams) {
            $rootScope.currentState = toState;
            $rootScope.currentParams = toParams;
        });
    });
