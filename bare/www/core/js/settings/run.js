angular.module('webmapp')
    .run(function (
        $ionicPlatform,
        $ionicPopup,
        $rootScope,
        $state,
        $translate,
        CONFIG,
        Offline) {
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
            // if (window.cordova && window.cordova.plugins.Keyboard) {
            //     cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
            //     window.cordova.plugins.Keyboard.disableScroll(true);
            // }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }
        });

        // if (sessionStorage.$wm_doBack) {
        $ionicPlatform.registerBackButtonAction(function (e) {
            e.preventDefault();
            if ($state.current.name == 'app.main.map' && sessionStorage.$wm_doBack) {
                if ($rootScope.backButtonPressed) {
                    Offline.resetCurrentMapAndGoBack();
                }
                else {
                    $rootScope.backButtonPressed = true;
                    $rootScope.backButtonPressedTimeout = setTimeout(function () {
                        $rootScope.backButtonPressed = false;
                    }, 2000);
                    $ionicPopup.confirm({
                        title: $translate.instant("ATTENZIONE"),
                        template: $translate.instant("Vuoi davvero chiudere l'itinerario?")
                    }).then(function (res) {
                        if (res) {
                            Offline.resetCurrentMapAndGoBack();
                        }
                        else {
                            try {
                                clearTimeout($rootScope.backButtonPressedTimeout);
                            }
                            catch (e) { }
                        }
                    });
                }
            }
            else if ($state.current.name == 'app.main.map') {
                if ($rootScope.backButtonPressed) {
                    navigator.app.exitApp();
                }
                else {
                    $rootScope.backButtonPressed = true;
                    $rootScope.backButtonPressedTimeout = setTimeout(function () {
                        $rootScope.backButtonPressed = false;
                    }, 2000);
                    $ionicPopup.confirm({
                        title: $translate.instant("ATTENZIONE"),
                        template: $translate.instant("Vuoi davvero chiudere l'applicazione?")
                    }).then(function (res) {
                        if (res) {
                            navigator.app.exitApp();
                        }
                        else {
                            try {
                                clearTimeout($rootScope.backButtonPressedTimeout);
                            }
                            catch (e) { }
                        }
                    });
                }
            } else {
                navigator.app.backHistory();
            }
        }, 101);
        // }

        $rootScope.$on('$stateChangeStart', function (e, toState, toParams) {
            $rootScope.currentState = toState;
            $rootScope.currentParams = toParams;
        });
    });
