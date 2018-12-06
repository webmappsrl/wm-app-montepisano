angular.module('webmapp')

    .controller('MenuController', function MenuController(
        // $cordovaKeyboard,
        $ionicModal,
        $ionicPopup,
        $ionicSideMenuDelegate,
        $rootScope,
        $scope,
        $state,
        $translate,
        Account,
        Auth,
        CONFIG,
        GeolocationService,
        Model,
        Offline,
        Utils
    ) {
        var vm = {};

        var registeredEvents = [];

        var loginConf = CONFIG.LOGIN || {},
            overlayLayersConf = CONFIG.OVERLAY_LAYERS;

        var postLoginModal = loginConf.postLoginModal,
            login = {};

        var trackRecordingEnabled = !Utils.isBrowser() && CONFIG.NAVIGATION && CONFIG.NAVIGATION.enableTrackRecording;

        var mainMenuItems = CONFIG.MENU,
            itemInGroupMap = {},
            overlayLayersConfMap = {};

        vm.colors = CONFIG.MAIN ? CONFIG.MAIN.STYLE : CONFIG.STYLE;

        vm.overlay_maps_group = [];
        vm.static_pages_group = [];
        vm.staticPages = [];
        vm.advancedMenuItems = [];
        vm.hideMenuButton = CONFIG.OPTIONS.hideMenuButton;
        vm.isNavigating = false;
        vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";
        vm.defaultLang = (CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual) ? CONFIG.LANGUAGES.actual.substring(0, 2) : "it";

        vm.isBrowser = Utils.isBrowser();

        vm.menuWidth = Math.min(window.innerWidth - 50, 400);
        vm.privacyUrl = 'http://www.webmapp.it/privacy/';

        if (!CONFIG.OPTIONS.mainMenuHideWebmappPage) {
            mainMenuItems[mainMenuItems.length] = {
                type: 'webmappInternal',
                label: 'Webmapp'
            };
        }

        if (!CONFIG.OPTIONS.mainMenuHideAttributionPage) {
            mainMenuItems[mainMenuItems.length] = {
                type: 'attributionInternal',
                label: 'Attribution'
            };
        }

        if (trackRecordingEnabled) {
            var showUserTracks = function (show) {
                var foundMapVoice = false;
                var found = false;
                var index = 0;
                for (var i in vm.advancedMenuItems) {
                    if (vm.advancedMenuItems[i].label === "I miei percorsi") {
                        found = true;
                        index = i;
                    } else if (vm.advancedMenuItems[i].type === "map") {
                        foundMapVoice = true;
                    }
                    if (found && foundMapVoice) {
                        break;
                    }
                }

                if (foundMapVoice && show && !found) {
                    var item = {
                        type: 'layer',
                        label: 'I miei percorsi'
                    };
                    var type = item.type,
                        currentUrl = Model.buildItemUrl(item);
                    vm.advancedMenuItems.push({
                        label: item.label,
                        url: currentUrl,
                        icon: item.icon,
                        color: item.color,
                        hideInBrowser: item.hideInBrowser,
                        type: type
                    });
                } else if ((!foundMapVoice || !show) && found) {
                    vm.advancedMenuItems.splice(index, 1);
                }
            };

            $rootScope.$on('updatedTracks', function (e, value) {
                showUserTracks(value);
            });
        }

        for (var i in mainMenuItems) {
            var type = mainMenuItems[i].type,
                currentUrl = Model.buildItemUrl(mainMenuItems[i]);
            if (type === 'layerGroup' || type === 'pageGroup') {
                for (var j in mainMenuItems[i].items) {
                    itemInGroupMap[mainMenuItems[i].items[j]] = true;
                }
            }
            vm.advancedMenuItems.push({
                label: mainMenuItems[i].label,
                url: currentUrl,
                icon: mainMenuItems[i].icon,
                color: mainMenuItems[i].color,
                hideInBrowser: mainMenuItems[i].hideInBrowser,
                type: mainMenuItems[i].type
            });
        }

        if (Auth.isLoggedIn()) {
            $rootScope.isLoggedIn = true;
        } else {
            $rootScope.isLoggedIn = false;
        }

        if (loginConf.useLogin) {
            var loginScope = $rootScope.$new();

            loginScope.state = {};

            var optionalFieldsConf = (CONFIG.LOGIN && CONFIG.LOGIN.optionalFields) ? CONFIG.LOGIN.optionalFields : [];

            loginScope.optionalFields = {
                firstName: false,
                lastName: false
            };

            for (var i in optionalFieldsConf) {
                if (optionalFieldsConf[i] === 'firstName') {
                    loginScope.optionalFields.firstName = true;
                } else if (optionalFieldsConf[i] === 'lastName') {
                    loginScope.optionalFields.lastName = true;
                }
            }

            var resetFields = function () {
                loginScope.ud = {};
                loginScope.ud.firstName = '';
                loginScope.ud.lastName = '';
                loginScope.ud.email = '';
                loginScope.ud.checkEmail = '';
                loginScope.ud.username = '';
                loginScope.ud.password = '';
                loginScope.ud.checkPassword = '';
                loginScope.ud.newsletter = false;
                loginScope.ud.privacy = '';
                loginScope.ud.country = '';
            };

            var isEmailValid = function (email) {
                var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,6})+$/;
                return email.match(mailformat);
            };

            resetFields();

            loginScope.marginForm = 0;
            loginScope.logging = false;

            loginScope.newsletter = CONFIG.LOGIN.showNewsletterCheckbox;

            loginScope.loginMode = '';
            loginScope.registrationMode = false;
            loginScope.urlPrivacy = vm.privacyUrl;
            loginScope.urlRecoveryPassword = CONFIG.LOGIN.passwordRecoveryURL ? CONFIG.LOGIN.passwordRecoveryURL : false;

            loginScope.facebook = typeof CONFIG.COMMUNICATION.facebookId !== 'undefined';
            loginScope.google = typeof CONFIG.COMMUNICATION.googleId !== 'undefined';
            loginScope.twitter = typeof CONFIG.COMMUNICATION.twitterId !== 'undefined' &&
                typeof CONFIG.COMMUNICATION.twitterSecret !== 'undefined';

            loginScope.resetFields = resetFields;

            loginScope.openInAppBrowser = Utils.openInAppBrowser;

            loginScope.setMode = function (mode) {
                loginScope.loginMode = mode;
            };

            loginScope.hide = function () {
                login.modal.hide();
            }

            loginScope.completeRegistration = function (firstName, lastName, email, password) {
                if (loginScope.logging) {
                    return;
                }

                // if (!Utils.isBrowser()) {
                //     $cordovaKeyboard.close();
                // }

                if (firstName && lastName && email && password) {
                    if (!isEmailValid(email)) {
                        $ionicPopup.alert({
                            title: $translate.instant("ATTENZIONE"),
                            template: $translate.instant("Inserisci un'email valida per continuare"),
                            buttons: [{
                                text: 'Ok',
                                type: 'button-positive'
                            }]
                        });
                    } else {
                        loginScope.logging = true;
                        Account.createAccount(firstName, lastName, email, password)
                            .then(function () {
                                loginScope.doLogin(email, password, true);
                            }, function () {
                                loginScope.logging = false;
                                $ionicPopup.alert({
                                    title: $translate.instant("ATTENZIONE"),
                                    template: $translate.instant("C'è stato un errore nella registrazione, riprova più tardi"),
                                    buttons: [{
                                        text: 'Ok',
                                        type: 'button-positive'
                                    }]
                                });
                            });
                    }
                } else {
                    $ionicPopup.alert({
                        title: $translate.instant("ATTENZIONE"),
                        template: $translate.instant("Compila tutti i campi richiesti"),
                        buttons: [{
                            text: 'Ok',
                            type: 'button-positive'
                        }]
                    });
                }
            };

            loginScope.completeSimpleRegistration = function (firstName, lastName, email, checkEmail, password, checkPassword, country, newsletter, privacy) {
                if (loginScope.logging) {
                    return;
                }

                // if (!Utils.isBrowser()) {
                //     $cordovaKeyboard.close();
                // }

                var validOptionalFields = firstName && lastName;
                if (!validOptionalFields) {
                    validOptionalFields = true;
                    if (!((!loginScope.optionalFields.firstName && firstName) || loginScope.optionalFields.firstName)) {
                        validOptionalFields = false;
                    } else if (!((!loginScope.optionalFields.lastName && lastName) || loginScope.optionalFields.lastName)) {
                        validOptionalFields = false;
                    }
                }

                if (email && password && checkEmail && checkPassword && validOptionalFields) {
                    if (!isEmailValid(email)) {
                        $ionicPopup.alert({
                            title: $translate.instant("ATTENZIONE"),
                            template: $translate.instant("Inserisci un'email valida per continuare"),
                            buttons: [{
                                text: 'Ok',
                                type: 'button-positive'
                            }]
                        });
                    } else if (privacy !== true) {
                        $ionicPopup.alert({
                            title: $translate.instant("ATTENZIONE"),
                            template: $translate.instant("Per registrarsi è richiesto accettare le condizioni dell'informativa sulla privacy"),
                            buttons: [{
                                text: 'Ok',
                                type: 'button-positive'
                            }]
                        });
                    } else if (password !== checkPassword) {
                        $ionicPopup.alert({
                            title: $translate.instant("ATTENZIONE"),
                            template: $translate.instant("La password e la conferma della password non coincidono"),
                            buttons: [{
                                text: 'Ok',
                                type: 'button-positive'
                            }]
                        });
                    } else if (email !== checkEmail) {
                        $ionicPopup.alert({
                            title: $translate.instant("ATTENZIONE"),
                            template: $translate.instant("L'email e la conferma dell'email non coincidono"),
                            buttons: [{
                                text: 'Ok',
                                type: 'button-positive'
                            }]
                        });
                    } else {
                        loginScope.logging = true;
                        Account.createAccount(firstName, lastName, email, password, country, newsletter, true)
                            .then(function (data) {
                                $ionicPopup.alert({
                                    title: $translate.instant("REGISTRAZIONE"),
                                    template: $translate.instant("Complimenti ti sei appena registrato"),
                                    buttons: [{
                                        text: 'Ok',
                                        type: 'button-positive'
                                    }]
                                });
                                loginScope.state.resetMode = false;
                                resetFields();
                                loginScope.logging = false;

                                //Saves the user data to localstorage
                                Auth.setUserData(data.data);
                                //Set the loggedIn flag to 'true'
                                $rootScope.isLoggedIn = true;
                                login.modal.hide();
                                $rootScope.$emit('logged-in');

                            }, function (error) {
                                $ionicPopup.alert({
                                    title: $translate.instant("ATTENZIONE"),
                                    template: error,
                                    buttons: [{
                                        text: 'Ok',
                                        type: 'button-positive'
                                    }]
                                }).then(function () {
                                    loginScope.logging = false;
                                });
                            });
                    }
                } else {
                    $ionicPopup.alert({
                        title: $translate.instant("ATTENZIONE"),
                        template: $translate.instant("Compila tutti i campi richiesti"),
                        buttons: [{
                            text: 'Ok',
                            type: 'button-positive'
                        }]
                    });
                }
            };

            loginScope.resetPassword = function (email) {
                if (!isEmailValid(email)) {
                    $ionicPopup.alert({
                        title: $translate.instant("ATTENZIONE"),
                        template: $translate.instant("Inserisci un'email valida per continuare"),
                        buttons: [{
                            text: 'Ok',
                            type: 'button-positive'
                        }]
                    });
                    return;
                }

                loginScope.logging = true;
                Account.resetPassword(email)
                    .then(function () {
                        loginScope.logging = false;
                        loginScope.state.resetMode = false;
                        resetFields();
                    }, function (error) {
                        $ionicPopup.alert({
                            title: $translate.instant("ATTENZIONE"),
                            template: error,
                            buttons: [{
                                text: 'Ok',
                                type: 'button-positive'
                            }]
                        });
                        loginScope.logging = false;
                    });
            };

            loginScope.openSocial = function (socialType) {
                loginScope.logging = true;

                Account.socialLogin(socialType)
                    .then(function (data) {
                        //Hide the loading message
                        loginScope.logging = false;

                        data.card = {};

                        if (data.user &&
                            data.user.field_user_card &&
                            data.user.field_user_card.und &&
                            data.user.field_user_card.und[0]) {

                            data.card = data.user.field_user_card.und[0];
                        }

                        //Saves the user data to localstorage
                        Auth.setUserData(data);

                        //Set the loggedIn flag to 'true'
                        $rootScope.isLoggedIn = true;

                        login.modal.hide();

                        // alert('then go to ???')
                        if (postLoginModal) {
                            // TODO: customize it
                            // openStaticPageModal({
                            //     template: 'card'
                            // });
                        }

                        $rootScope.$emit('logged-in');

                        resetFields();
                    }, function (error) {
                        loginScope.logging = false;

                        if (typeof error !== 'undefined') {
                            $ionicPopup.alert({
                                title: $translate.instant("ATTENZIONE"),
                                template: error,
                                buttons: [{
                                    text: 'Ok',
                                    type: 'button-positive'
                                }]
                            });
                        }
                    });
            };

            loginScope.skipLogin = function () {
                login.modal.hide();
            };

            loginScope.doLogin = function (username, password, force) {
                if (loginScope.logging && !force) {
                    return;
                }

                // if (!Utils.isBrowser()) {
                //     $cordovaKeyboard.close();
                // }

                if ((typeof username !== 'string' || username.length < 2) &&
                    (typeof password !== 'string' || password.length === 0)) {
                    $ionicPopup.alert({
                        title: $translate.instant("ATTENZIONE"),
                        template: $translate.instant("Inserisci username e password"),
                        buttons: [{
                            text: 'Ok',
                            type: 'button-positive'
                        }]
                    });
                    return;
                }

                // if ($cordovaNetwork.isOffline()) {
                //     alert('Collegati a Internet per effettuare il login');
                //     return;
                // }

                // Shows the 'loading' gif or message
                loginScope.logging = true;

                Account.login(username, password)
                    .then(function (data) {

                        //This is the success function of the promise
                        // login.user = data;

                        //Hide the loading message
                        loginScope.logging = false;

                        data.card = {};

                        if (data.user &&
                            data.user.field_user_card &&
                            data.user.field_user_card.und &&
                            data.user.field_user_card.und[0]) {

                            data.card = data.user.field_user_card.und[0];
                        }

                        //Saves the user data to localstorage
                        Auth.setUserData(data);

                        //Set the loggedIn flag to 'true'
                        $rootScope.isLoggedIn = true;

                        login.modal.hide();

                        if (postLoginModal) {
                            // TODO: customize
                            // openStaticPageModal({
                            //     template: 'card'
                            // });
                        }

                        $rootScope.$emit('logged-in');

                        if (force) {
                            loginScope.state.registrationMode = false;
                        }

                        resetFields();
                    }, function (error) {
                        loginScope.logging = false;
                        $ionicPopup.alert({
                            title: $translate.instant("ATTENZIONE"),
                            template: $translate.instant("Email o password errati"),
                            buttons: [{
                                text: 'Ok',
                                type: 'button-positive'
                            }]
                        });
                    });
            };

            $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/loginModal.html', {
                scope: loginScope,
                animation: 'slide-in-up',
                backdropClickToClose: false,
                hardwareBackButtonClose: false
            }).then(function (modal) {
                login.modal = modal;
                if (loginConf.forceLogin && $rootScope.isLoggedIn === false) {
                    login.modal.show();
                    login.marginForm = (document.getElementById('login-view').getClientRects()[0].height / 2) - (253 / 2) - 44;
                }
            });

            $rootScope.showLogin = vm.showLogin = function (registrationMode) {
                if (registrationMode) {
                    loginScope.state.registrationMode = true;
                } else {
                    loginScope.state.registrationMode = false;
                }

                vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";
                vm.privacyUrl = 'http://www.webmapp.it/privacy/';
                if (CONFIG.COMMUNICATION.privacy) {
                    if (CONFIG.COMMUNICATION.privacy[vm.currentLang]) {
                        vm.privacyUrl = CONFIG.COMMUNICATION.privacy[vm.currentLang];
                    } else if (CONFIG.COMMUNICATION.privacy[vm.defaultLang]) {
                        vm.privacyUrl = CONFIG.COMMUNICATION.privacy[vm.defaultLang];
                    } else if (typeof CONFIG.COMMUNICATION.privacy !== 'string') {
                        vm.privacyUrl = CONFIG.COMMUNICATION.privacy[Object.keys(CONFIG.COMMUNICATION.privacy)[0]];
                    } else {
                        vm.privacyUrl = CONFIG.COMMUNICATION.privacy;
                    }
                }
                loginScope.urlPrivacy = vm.privacyUrl;

                login.modal.show();
            };
        }

        angular.forEach(overlayLayersConf, function (layer) {
            overlayLayersConfMap[layer.label] = layer;
        });

        if (CONFIG.SHOW_OFFLINE_PAGE == 'yes' && !Utils.isBrowser()) {
            vm.showOfflinePage = 'yes';
        }

        vm.openStaticPageModal = function (page) {
            var newScope = $rootScope.$new(),
                baseUrl = templateCustomPath || '';
            newScope.openInExternalBrowser = Utils.openInExternalBrowser;
            newScope.openInAppBrowser = Utils.openInAppBrowser;
            newScope.openCordovaWebView = Utils.openCordovaWebView;
            $ionicModal.fromTemplateUrl(baseUrl + 'templates/static_pages/' + page.template + '.html', {
                scope: newScope,
                icon: page.icon,
                animation: 'slide-in-up'
            }).then(function (modal) {
                vm.modal = newScope.modal = modal;
                modal.show();
            });
        };

        vm.openStaticStandardPageModal = function (pageTemplate) {
            var newScope = $rootScope.$new(),
                baseUrl = templateCustomPath || '';
            newScope.currentUrl = window.location.href;

            newScope.openInAppBrowser = Utils.openInAppBrowser;

            $ionicModal.fromTemplateUrl(baseUrl + 'templates/static_pages/' + pageTemplate + '.html', {
                scope: newScope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                vm.modal = newScope.modal = modal;
                modal.show();
                new Clipboard('.copy');
            });
        };

        vm.goTo = function (url, type) {
            if (type === 'internalLink') {
                location.href = url;
            } else if (type === 'closeMap') {
                if (GeolocationService.isActive()) {
                    GeolocationService.disable();
                }
                Offline.resetCurrentMapAndGoBack();
            } else {
                Utils.goTo(url);
            }

            setTimeout(function () {
                $ionicSideMenuDelegate.toggleLeft();
            }, 10);
        };

        registeredEvents.push(
            $scope.$on('$stateChangeSuccess', function () {
                var currentState = $rootScope.currentState.name;

                vm.isCardPage = currentState === 'app.main.card';
                vm.isDetailPage = currentState === 'app.main.detaillayer' || currentState === 'app.main.detailevent';
                vm.isEventDetailPage = currentState === 'app.main.detailevent';
                vm.isWelcomePage = currentState === 'app.main.welcome';

                if (currentState === 'app.main.detaillayer' ||
                    currentState === 'app.main.detailulayer' ||
                    currentState === 'app.main.detailevent' ||
                    currentState === 'app.main.route'
                ) {
                    vm.hideMenuButton = false;
                } else {
                    vm.hideMenuButton = CONFIG.OPTIONS.hideMenuButton;
                }

                if (currentState === 'app.main.detaillayer' &&
                    $state.params &&
                    $state.params.parentId &&
                    typeof overlayLayersConfMap[$state.params.parentId.replace(/_/g, ' ')] !== 'undefined' &&
                    overlayLayersConfMap[$state.params.parentId.replace(/_/g, ' ')].type === 'poi_geojson') {
                    setTimeout(function () {
                        vm.isAPOI = true;
                    }, 1000);
                } else {
                    vm.isAPOI = false;
                }
            })
        );

        registeredEvents.push(
            $rootScope.$on('is-navigating', function (e, value) {
                vm.isNavigating = value;
            })
        );

        registeredEvents.push(
            $rootScope.$on('language-changed', function (e, value) {
                vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";
            })
        );

        registeredEvents.push(
            $scope.$on('$destroy', function () {
                for (var i in registeredEvents) {
                    registeredEvents[i]();
                }
                delete registeredEvents;

                modalImage.remove();
            })
        );

        return vm;
    });
