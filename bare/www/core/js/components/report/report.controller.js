angular.module('webmapp')

    .controller('ReportController', function ReportController(
        $ionicPopup,
        $scope,
        $translate,
        Auth,
        Communication,
        CONFIG,
        GeolocationService,
        Utils
    ) {
        var vm = {};

        var toastTimeout = null,
            position = [],
            registeredEvents = [],
            report = {},
            userData = {};

        vm.title = "Segnala";
        vm.colors = CONFIG.STYLE;
        vm.isAndroid = window.cordova && window.cordova.platformId === "android" ? true : false;

        vm.reports = (CONFIG.USER_COMMUNICATION && CONFIG.USER_COMMUNICATION.REPORT && CONFIG.USER_COMMUNICATION.REPORT.items) ? angular.copy(CONFIG.USER_COMMUNICATION.REPORT.items) : [];
        vm.selectedReport = vm.reports.length === 1 ? 0 : -1;

        vm.isLoading = false;

        vm.goBack = function () {
            if (vm.selectedReport !== -1 && vm.reports.length !== 1) {
                vm.selectedReport = -1;
                vm.title = "Segnala";
            }
            else {
                Utils.goBack();
            }
            Utils.forceDigest();
        };

        vm.selectReport = function (key) {
            vm.selectedReport = key;
            vm.title = vm.reports[key].title;

            for (var i in vm.reports[key].fields) {
                if (vm.reports[key].fields[i].type === 'checkbox') {
                    vm.reports[key].fields[i].value = [];
                }
                else if (vm.reports[key].fields[i].type !== 'hidden') {
                    vm.reports[key].fields[i].value = "";
                }

            }

            vm.validateForm();
            Utils.forceDigest();
        };

        vm.showHelp = function (key) {
            try {
                clearTimeout(toastTimeout);
            }
            catch (e) { }

            Utils.showToast(vm.reports[vm.selectedReport].fields[key].help, 'bottom');
            toastTimeout = setTimeout(function () {
                toastTimeout = null;
                Utils.hideToast();
            }, 5000);
        };

        vm.getPicture = function (sourceType, key) {
            if (navigator.camera) {
                var options = {
                    quality: 10,
                    destinationType: navigator.camera.DestinationType.DATA_URL,
                    sourceType: sourceType ? navigator.camera.PictureSourceType.CAMERA : navigator.camera.PictureSourceType.PHOTOLIBRARY,
                    saveToPhotoAlbum: true
                };

                navigator.camera.getPicture(function (data) {
                    vm.reports[vm.selectedReport].fields[key].value = data;
                    $(window).trigger('resize');
                    vm.validateForm();
                    Utils.forceDigest();
                }, function (err) {
                    console.warn(err);
                }, options);
            }
        };

        vm.resetPicture = function (key) {
            vm.reports[vm.selectedReport].fields[key].value = '';
            vm.validateForm();
            Utils.forceDigest();
        };

        vm.toggleOption = function (fieldKey, optionKey) {
            if (vm.reports[vm.selectedReport].fields[fieldKey].type === 'checkbox') {
                var found = false;
                for (var i in vm.reports[vm.selectedReport].fields[fieldKey].value) {
                    if (vm.reports[vm.selectedReport].fields[fieldKey].value[i] === optionKey) {
                        vm.reports[vm.selectedReport].fields[fieldKey].value.splice(i, 1);
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    vm.reports[vm.selectedReport].fields[fieldKey].value.push(optionKey);
                }
            }
            else if (vm.reports[vm.selectedReport].fields[fieldKey].type === 'radio') {
                vm.reports[vm.selectedReport].fields[fieldKey].value = optionKey;
            }
            Utils.forceDigest();
            vm.validateForm();
        };

        vm.isSelected = function (fieldKey, optionKey) {
            if (vm.reports[vm.selectedReport].fields[fieldKey].type === 'checkbox') {
                for (var i in vm.reports[vm.selectedReport].fields[fieldKey].value) {
                    if (vm.reports[vm.selectedReport].fields[fieldKey].value[i] === optionKey) {
                        return true;
                    }
                }
                return false;
            }
            else if (vm.reports[vm.selectedReport].fields[fieldKey].type === 'radio') {
                if (vm.reports[vm.selectedReport].fields[fieldKey].value === optionKey) {
                    return true;
                }
                return false;
            }
        };

        vm.validateForm = function () {
            var valid = true;
            var fields = vm.reports[vm.selectedReport].fields;
            for (var i in fields) {
                if (fields[i].mandatory) {
                    if (fields[i].type === 'checkbox' && fields[i].value.length === 0) {
                        valid = false;
                        break;
                    }
                    else if (vm.reports[vm.selectedReport].fields[i].value === "" && vm.reports[vm.selectedReport].fields[i].mandatory) {
                        valid = false;
                        break;
                    }
                }
            }

            vm.isValid = valid;
        };

        vm.sendReport = function () {
            report.type = vm.reports[vm.selectedReport].type;
            report.form_data = {};

            vm.isLoading = true;

            for (var i in vm.reports[vm.selectedReport].fields) {
                report.form_data[vm.reports[vm.selectedReport].fields[i].name] = vm.reports[vm.selectedReport].fields[i].value;
            }

            var url = CONFIG.USER_COMMUNICATION.apiUrl ? CONFIG.USER_COMMUNICATION.apiUrl : "https://api.webmapp.it/services/share.php";
            Communication.queuedPost(url, report).then(function (res) {
                vm.isLoading = false;
                if (res) {
                    $ionicPopup.alert({
                        title: $translate.instant("ATTENZIONE"),
                        template: $translate.instant("La tua segnalazione è stata inviata con successo")
                    });
                }
                else {
                    $ionicPopup.alert({
                        title: $translate.instant("ATTENZIONE"),
                        template: $translate.instant("Connessione assente: la tua segnalazione è pronta per essere presa in carico e sarà inviata appena possibile")
                    });
                }
                Utils.goTo('/');
            }, function () {
                vm.isLoading = false;
                $ionicPopup.alert({
                    title: $translate.instant("ATTENZIONE"),
                    template: $translate.instant("Si è verificato un errore, riprova")
                });
            });
        };

        registeredEvents.push(
            $scope.$on('$ionicView.afterEnter', function () {
                if (GeolocationService.isActive()) {
                    position = GeolocationService.getCurrentPosition();

                    if (position === ERRORS.OUTSIDE_BOUNDING_BOX) {
                        $ionicPopup.alert({
                            title: $translate.instant("ATTENZIONE"),
                            template: $translate.instant("Sembra che tu sia fuori dai limiti della mappa: la richiesta di aiuto non è disponibile.")
                        });
                        geolocationError();
                    } else if (!position || !position.lat || !position.long) {
                        $ionicPopup.alert({
                            title: $translate.instant("ATTENZIONE"),
                            template: $translate.instant("Devi essere localizzato per segnalare la tua posizione")
                        });
                        Utils.goBack();
                    }
                    else {
                        report.app = {
                            id: CONFIG.appId,
                            routeId: CONFIG.routeID ? CONFIG.routeID : null,
                            name: CONFIG.MAIN ? CONFIG.MAIN.OPTIONS.title : CONFIG.OPTIONS.title,
                            route: CONFIG.MAIN ? CONFIG.OPTIONS.title : null
                        };

                        var device = ionic.Platform.device();

                        report.device = {
                            os: device.platform,
                            version: device.version
                        };

                        userData = Auth.getUserData();
                        if (userData && userData.ID) {
                            report.user = {
                                id: userData.ID,
                                email: userData.user_email,
                                first_name: userData.first_name,
                                last_name: userData.last_name
                            };
                        }
                        else {
                            report.user = {};
                        }

                        report.timestamp = Date.now();

                        if (position.altitude) {
                            report.position = [position.long, position.lat, position.altitude];
                        }
                        else {
                            report.position = [position.long, position.lat];
                        }
                    }
                }
                else {
                    $ionicPopup.alert({
                        title: $translate.instant("ATTENZIONE"),
                        template: $translate.instant("Devi essere localizzato per segnalare la tua posizione")
                    });
                    Utils.goBack();
                }
            })
        );

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
