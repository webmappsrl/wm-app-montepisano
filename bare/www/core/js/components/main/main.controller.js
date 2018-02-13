angular.module('webmapp')

    .controller('MainController', function MainController(
        $scope,
        $rootScope,
        $state,
        $ionicLoading,
        $ionicScrollDelegate,
        $ionicPopup,
        Utils,
        MapService,
        Communication,
        Model,
        $cordovaGeolocation,
        $cordovaDeviceOrientation,
        $cordovaSocialSharing,
        CONFIG,
        $translate,
        Auth,
        $ionicPlatform
    ) {
        var vm = {};

        var overlaysGroupMap = Model.getOverlaysGroupMap(),
            overlayMap = Model.getOverlaysMap();

        var previousBounds = null,
            heading = 0,
            watchInterval, orientationWatchRef,
            prevHeating, prevLatLong, lpf;

        var maxZoom = CONFIG.MAP.maxZoom,
            hideExpanderInDetails = CONFIG.OPTIONS.hideExpanderInDetails;

        var shareScope = $rootScope.$new(),
            shareModal;

        var distanceInMeters = function (lat1, lon1, lat2, lon2) {
            var R = 6371, // Radius of the earth in km
                dLat = (lat2 - lat1) * Math.PI / 180, // deg2rad below
                dLon = (lon2 - lon1) * Math.PI / 180,
                a = 0.5 - Math.cos(dLat) / 2 +
                Math.cos(lat1 * Math.PI / 180) *
                Math.cos(lat2 * Math.PI / 180) *
                (1 - Math.cos(dLon)) / 2;

            return (R * 2 * Math.asin(Math.sqrt(a))) * 1000;
        };

        var isLandscape = function () {
            var result = false;

            switch (window.orientation) {
                case -90:
                case 90:
                    result = true;
                    break;
                default:
                    result = false;
                    break;
            }

            return result;
        };

        var checkGPS = function () {
            var onSuccess = function (e) {
                if (e) {
                    vm.dragged = true;
                    vm.gpsActive = true;
                    vm.centerOnMe();
                } else {
                    return $ionicPopup.confirm({
                            title: $translate.instant("ATTENZIONE"),
                            template: $translate.instant("Sembra che tu abbia il GPS disattivato. Per accedere a tutte le funzionalità dell'app occorre attivarlo. Vuoi farlo ora?")
                        })
                        .then(function (res) {
                            if (res) {
                                if (window.cordova.platformId === "ios") {
                                    cordova.plugins.diagnostic.switchToSettings();
                                } else {
                                    cordova.plugins.diagnostic.switchToLocationSettings();
                                }
                                return;
                            } else {
                                return;
                            }
                        })
                }
            };

            var onError = function (e) {
                alert("Error: " + e);
                console.log("Error: ", e);
            };

            if (window.cordova && vm.showLocate && $state.current.name === "app.main.map") {
                return cordova.plugins.diagnostic.isLocationAuthorized(function (authorized) {
                    if (authorized) {
                        if (window.cordova.platformId === "ios") {
                            return cordova.plugins.diagnostic.isLocationEnabled(
                                onSuccess,
                                onError
                            );
                        } else {
                            return cordova.plugins.diagnostic.isGpsLocationEnabled(
                                onSuccess,
                                onError
                            );
                        }
                    } else {
                        if (window.cordova.platformId === "ios") {
                            var permissionDenied = localStorage.$wm_ios_location_permission_denied ? true : false;
                            if (permissionDenied) {
                                $ionicPopup.alert({
                                    title: $translate.instant("ATTENZIONE"),
                                    template: $translate.instant("Tutte le funzionalità legate alla tua posizione sono disabilitate. Puoi riattivarle autorizzando l'uso della tua positione tramite le impostazioni del tuo dispositivo"),
                                    buttons: [{
                                        text: 'Ok',
                                        type: 'button-positive'
                                    }]
                                });
                                return;
                            }
                        }

                        return cordova.plugins.diagnostic.requestLocationAuthorization(function (status) {
                            switch (status) {
                                case cordova.plugins.diagnostic.permissionStatus.GRANTED:
                                case cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE:
                                    if (window.cordova.platformId === "ios") {
                                        return cordova.plugins.diagnostic.isLocationEnabled(
                                            onSuccess,
                                            onError
                                        );
                                    } else {
                                        return cordova.plugins.diagnostic.isGpsLocationEnabled(
                                            onSuccess,
                                            onError
                                        );
                                    }
                                    break;
                                case cordova.plugins.diagnostic.permissionStatus.DENIED:
                                    if (window.cordova.platformId === "ios") {
                                        localStorage.$wm_ios_location_permission_denied = true;
                                        $ionicPopup.alert({
                                            title: $translate.instant("ATTENZIONE"),
                                            template: $translate.instant("Tutte le funzionalità legate alla tua posizione sono disabilitate. Puoi riattivarle autorizzando l'uso della tua positione tramite le impostazioni del tuo dispositivo"),
                                            buttons: [{
                                                text: 'Ok',
                                                type: 'button-positive'
                                            }]
                                        });
                                    } else {
                                        $ionicPopup.alert({
                                            title: $translate.instant("ATTENZIONE"),
                                            template: $translate.instant("Alcune funzionalità funzionano solo se hai abilitato la geolocalizzazione"),
                                            buttons: [{
                                                text: 'Ok',
                                                type: 'button-positive'
                                            }]
                                        });
                                    }
                                    break;
                                case cordova.plugins.diagnostic.permissionStatus.DENIED_ALWAYS:
                                    $ionicPopup.alert({
                                        title: $translate.instant("ATTENZIONE"),
                                        template: $translate.instant("Tutte le funzionalità legate alla tua posizione sono disabilitate. Puoi attivarle autorizzando l'uso della tua positione tramite le impostazioni del tuo dispositivo"),
                                        buttons: [{
                                            text: 'Ok',
                                            type: 'button-positive'
                                        }]
                                    });
                                    break;
                            }
                        });
                    }
                });
            }
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
                    template: $translate.instant("Inserisci un'email valida per continuare"),
                    buttons: [{
                        text: 'Ok',
                        type: 'button-positive'
                    }]
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
                                template: $translate.instant("Si è verificato un errore di connessione, riprova più tardi"),
                                buttons: [{
                                    text: 'Ok',
                                    type: 'button-positive'
                                }]
                            });
                            shareScope.vm.sendInProgress = false;
                        });
            }
        };

        vm.isLandscape = isLandscape();
        vm.hideDeactiveCentralPointer = CONFIG.OPTIONS.hideDeactiveCentralPointer;
        vm.followActive = false;
        vm.isRotating = false;
        vm.canFollow = false;

        vm.dragged = false;
        vm.isCoordsBlockExpanded = true;
        vm.gpsActive = false;
        vm.outsideBoundingBox = false;
        vm.isOutsideBoundingBox = false;

        vm.deg = 0;
        vm.colors = CONFIG.STYLE;
        vm.hideHowToReach = CONFIG.OPTIONS.hideHowToReach;
        vm.useExandMapInDetails = CONFIG.OPTIONS.useExandMapInDetails;
        vm.showLocate = !CONFIG.MAP.hideLocationControl || !Utils.isBrowser();
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

        vm.shareCurrentPosition = function ($event) {
            $event.stopPropagation();

            if (!navigator.onLine) {
                $ionicPopup.alert({
                    title: $translate.instant("ATTENZIONE"),
                    template: $translate.instant("Questa funzionalità è disponibile solo con una connessione attiva. Controlla la tua connessione e riprova"),
                    buttons: [{
                        text: 'Ok',
                        type: 'button-positive'
                    }]
                });
                return;
            }

            if (!vm.useShare) {
                return;
            }

            shareOptions = {
                message: "",
                mailSubject: "",
                baseUrl: CONFIG.COMMUNICATION.baseUrl
            };

            if (CONFIG.REPORT.type === 'social') {
                $cordovaSocialSharing
                    .share(
                        shareOptions.message,
                        shareOptions.mailSubject,
                        undefined,
                        shareOptions.baseUrl +
                        '/#/?map=' +
                        MapService.getZoom() + '/' +
                        vm.centerCoords.lat + '/' +
                        vm.centerCoords.lng)
                    .then(function (result) {
                        // Success!
                    }, function (err) {
                        // An error occured. Show a message to the user
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
                    template: $translate.instant("Sembra che tu sia fuori dai limiti della mappa: la richiesta di aiuto non è disponibile."),
                    buttons: [{
                        text: 'Ok',
                        type: 'button-positive'
                    }]
                });
                return;
            }

            if (!prevLatLong) {
                $ionicPopup.alert({
                    title: $translate.instant("ATTENZIONE"),
                    template: $translate.instant("Devi essere localizzato per segnalare la tua posizione"),
                    buttons: [{
                        text: 'Ok',
                        type: 'button-positive'
                    }]
                });
                return;
            }

            var userData = Auth.getUserData();
            $event.stopPropagation();
            text = "ALERT MSG - Myeasyroute user: " +
                userData.user_email + " nome: " + userData.first_name + " cognome: " + userData.last_name + " https://www.google.com/maps/search/?api=1&query=" +
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
                                    email: userData.user_email,
                                    firstName: userData.first_name,
                                    lastName: userData.last_name,
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
        }

        vm.turnOffGeolocationAndRotion = function () {
            if (!vm.canFollow) {
                return;
            }

            vm.canFollow = false;

            if (vm.isRotating) {
                orientationWatchRef.clearWatch();
            }

            if (vm.followActive) {
                clearInterval(watchInterval);
            }

            vm.followActive = false;
            vm.isRotating = false;

            setTimeout(function () {
                MapService.setBearing(-359.95);
                MapService.setBearing(-359.97);
                MapService.setBearing(-359.99);
            }, 100);

            MapService.stopControlLocate();
        };

        vm.centerOnMe = function () {

            if (!vm.gpsActive) {
                checkGPS();
                return;
            }

            if (vm.locateLoading) {
                return;
            }

            if (vm.useExandMapInDetails && vm.detail) {
                MapService.stopControlLocate();
                MapService.getFeatureById($state.params.id, $rootScope.currentParams.parentId.replace(/_/g, ' '))
                    .then(function (feature) {
                        var featureLat = feature.geometry.coordinates[1],
                            featureLong = feature.geometry.coordinates[0];

                        vm.locateLoading = true;

                        $cordovaGeolocation
                            .getCurrentPosition({
                                timeout: 10000,
                                enableHighAccuracy: Utils.isBrowser() ? true : false
                            })
                            .then(function (position) {
                                var posLat = position.coords.latitude,
                                    posLong = position.coords.longitude;

                                var sw, ne;
                                if (!MapService.isInBoundingBox(posLat, posLong)) {
                                    vm.outsideBoundingBox = true;
                                    $ionicPopup.alert({
                                        title: $translate.instant("ATTENZIONE"),
                                        template: $translate.instant("Sembra che tu sia fuori dai limiti della mappa"),
                                        buttons: [{
                                            text: 'Ok',
                                            type: 'button-positive'
                                        }]
                                    });
                                } else {
                                    MapService.createPositionMarkerAt(posLat, posLong);

                                    sw = ((featureLong > posLong ? featureLong : posLong) + 0.001) + ' ' + ((featureLat > posLat ? featureLat : posLat) + 0.001)
                                    ne = ((featureLong < posLong ? featureLong : posLong) - 0.001) + ' ' + ((featureLat < posLat ? featureLat : posLat) - 0.001)

                                    MapService.fitBoundsFromString(sw + ',' + ne);
                                }

                                vm.locateLoading = false;
                            }, function (err) {
                                vm.locateLoading = false;
                                $ionicPopup.alert({
                                    title: $translate.instant("ATTENZIONE"),
                                    template: err.message,
                                    buttons: [{
                                        text: 'Ok',
                                        type: 'button-positive'
                                    }]
                                });
                            });

                    }, function () {
                        console.error('Retrive feature error');
                    });

                return;
            }

            if (vm.dragged && prevLatLong) {
                vm.dragged = false;
                MapService.centerOnCoords(prevLatLong.lat, prevLatLong.long);
                return;
            } else {
                MapService.startControlLocate();
            }

            if (vm.canFollow || vm.isRotating) {
                if (vm.isRotating) {
                    vm.turnOffGeolocationAndRotion();
                } else {
                    MapService.setZoom(maxZoom);
                    lpf = new LPF(0.5);

                    orientationWatchRef = $cordovaDeviceOrientation.watchHeading({
                        frequency: 80,
                        // filter: true // when true, the frequecy is ignored
                    });
                    orientationWatchRef.then(
                        null,
                        function (error) {
                            if (vm.isRotating) {
                                vm.isRotating = false;
                            }
                            console.error(error);
                        },
                        function (result) {
                            if (!vm.canFollow) {
                                return;
                            }

                            if (!vm.isRotating) {
                                vm.isRotating = true;
                            }
                            if (Math.abs(result.magneticHeading - prevHeating) > 100) {
                                lpf = new LPF(0.5);
                                lpf.init(Array(6).fill(result.magneticHeading));
                            }

                            heading = vm.isLandscape ? lpf.next(result.magneticHeading) + window.orientation : lpf.next(result.magneticHeading);
                            MapService.setBearing(-heading);
                            prevHeating = heading;

                            vm.deg = heading;
                        });
                }
            } else {
                if (vm.followActive) {
                    vm.turnOffGeolocationAndRotion();
                } else {
                    vm.locateLoading = true;
                    $cordovaGeolocation
                        .getCurrentPosition({
                            timeout: 10000,
                            enableHighAccuracy: Utils.isBrowser() ? true : false
                        })
                        .then(function (position) {
                            var lat = position.coords.latitude,
                                long = position.coords.longitude;

                            var posCallback = function (position) {
                                var lat = position.coords.latitude,
                                    long = position.coords.longitude,
                                    doCenter = false;

                                if (!prevLatLong) {
                                    doCenter = true;
                                } else if (distanceInMeters(lat, long, prevLatLong.lat, prevLatLong.long) > 6) {
                                    doCenter = true;
                                }

                                if (doCenter) {
                                    MapService.drawPosition(position);
                                    if (!vm.dragged) {
                                        MapService.centerOnCoords(lat, long);
                                    }
                                    prevLatLong = {
                                        lat: lat,
                                        long: long
                                    };
                                }
                                else {
                                    MapService.drawAccuracy(position.coords.accuracy);
                                }
                            };

                            if (!MapService.isInBoundingBox(lat, long)) {
                                vm.locateLoading = false;
                                vm.isOutsideBoundingBox = true;
                                $ionicPopup.alert({
                                    title: $translate.instant("ATTENZIONE"),
                                    template: $translate.instant("Sembra che tu sia fuori dai limiti della mappa"),
                                    buttons: [{
                                        text: 'Ok',
                                        type: 'button-positive'
                                    }]
                                });
                                return;
                            }

                            MapService.centerOnCoords(lat, long);
                            vm.locateLoading = false;

                            if (Utils.isBrowser()) {
                                MapService.setZoom(maxZoom);
                            } else  {
                                vm.canFollow = true;
                                vm.followActive = true;

                                if (CONFIG.OPTIONS.useIntervalInsteadOfWatch) {
                                    watchInterval = setInterval(function () {
                                        $cordovaGeolocation
                                            .getCurrentPosition({
                                                timeout: 10000,
                                                enableHighAccuracy: true
                                            })
                                            .then(posCallback);
                                    }, CONFIG.OPTIONS.intervalUpdateMs);
                                } else {
                                    watchInterval = $cordovaGeolocation.watchPosition({
                                        timeout: 10000,
                                        enableHighAccuracy: true
                                    });
                                    watchInterval.then(
                                        null,
                                        function (err) {
                                            console.error(err);
                                        },
                                        posCallback);
                                }

                            }
                        }, function (err) {
                            vm.locateLoading = false;
                            $ionicPopup.alert({
                                title: $translate.instant("ATTENZIONE"),
                                template: err.message,
                                buttons: [{
                                    text: 'Ok',
                                    type: 'button-positive'
                                }]
                            });
                        });
                }

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
            MapService.setFilter($state.params.parentId.replace(/_/g, " "), true);

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
            setTimeout(function () {
                MapService.adjust();
            }, 350);
            MapService.adjust();
            $rootScope.$emit('expand-map', vm.isMapPage);
        };

        $scope.$on('$stateChangeStart', function (e, dest) {
            if ((dest.name === 'app.main.detaillayer' ||
                    dest.name === 'app.main.detailevent' ||
                    dest.name === 'app.main.detailulayer') &&
                previousBounds === null) {
                previousBounds = MapService.getBounds();
            }
        });

        $scope.$on('$stateChangeSuccess', function () {
            var currentState = $rootScope.currentState.name,
                realState;

            var layerState = false;

            vm.turnOffGeolocationAndRotion();
            MapService.removePositionMarker();

            if (currentState !== 'app.main.detaillayer' &&
                currentState !== 'app.main.detailevent' &&
                currentState !== 'app.main.detailulayer' &&
                previousBounds) {
                setTimeout(function () {
                    // MapService.fitBounds(previousBounds);
                    previousBounds = null;
                }, 1250);
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

            // setTimeout(function() {
            //     MapService.adjust();
            // }, $rootScope.stateCounter === 1 ? 4500 : 1000);

            vm.hideMap = false;
            vm.mapView = false;


            if (currentState === 'app.main.map') {
                vm.mapView = true;
                vm.hideExpander = true;
            } else if (currentState === 'app.main.events') {
                MapService.showEventsLayer();
                vm.hasShadow = true;
            } else if (currentState === 'app.main.welcome') {
                // TODO: show nothing on the map
            } else if (currentState === 'app.main.layer') {
                realState = $rootScope.currentParams.id.replace(/_/g, ' ');
                layerState = true;

                if (typeof overlayMap[realState] !== 'undefined' ||
                    typeof overlaysGroupMap[realState] !== 'undefined') {

                    setTimeout(function () {
                        if (layerState) {
                            MapService.activateLayer(realState, false, true);
                        }
                    }, 50);
                } else {
                    // TODO: go to map? 
                    // vm.hideMap = true;
                }

                // vm.hasShadow = true;
            } else if (currentState === 'app.main.detaillayer') {
                if (MapService.isAPOILayer($rootScope.currentParams.parentId.replace(/_/g, ' '))) {
                    vm.detail = true;
                }
                // TODO: check the shadow
                // else {
                //     vm.hasShadow = true;
                // }

                vm.hideExpander = hideExpanderInDetails;
            } else if (currentState === 'app.main.detailevent') {
                vm.hasShadow = true;
            } else if (currentState === 'app.main.detailulayer') {
                MapService.resetUtfGridLayers();
                vm.hideExpander = true;
            } else if (currentState === 'app.main.coupons' || currentState === 'app.main.packages' || currentState === 'app.main.route' || currentState === 'app.main.languages' || currentState === 'app.main.webmappInternal' || currentState === 'app.main.attributionInternal') {
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
        });

        $rootScope.$on('toggle-map-in-search', function (e, value) {
            vm.isMapModeInSearch = value;
            setTimeout(function () {
                MapService.adjust();
            }, 350);
        });

        $rootScope.$on('toggle-map-from-detail', function () {
            vm.toggleMap();
        });

        $rootScope.$on('toggle-list', function (e, value) {
            vm.hideMap = value;
            setTimeout(function () {
                MapService.adjust();
                angular.element(window).triggerHandler('resize');
            }, 350);
        });

        $rootScope.$on('map-dragstart', function (e, value) {
            vm.locateLoading = false;
            if (vm.isRotating) {
                vm.centerOnMe();
            } else {
                vm.dragged = true;
            }
        });

        $rootScope.$on('item-navigable', function (e, value) {
            vm.isNavigable = value;
        });

        window.addEventListener('orientationchange', function () {
            vm.isLandscape = isLandscape();
        });

        $ionicPlatform.ready(function () {
            checkGPS();
        });

        return vm;
    });