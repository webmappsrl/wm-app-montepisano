angular.module('webmapp')

    .controller('MainController', function MainController(
        $cordovaDeviceOrientation,
        $cordovaGeolocation,
        $cordovaSocialSharing,
        $interval,
        $ionicLoading,
        $ionicPlatform,
        $ionicPopup,
        $ionicScrollDelegate,
        $rootScope,
        $scope,
        $state,
        $translate,
        Auth,
        Communication,
        CONFIG,
        MapService,
        Model,
        Utils
    ) {
        var vm = {};

        var overlaysGroupMap = Model.getOverlaysGroupMap(),
            overlayMap = Model.getOverlaysMap();

        var previousBounds = null,
            heading = 0,
            watchInterval, orientationWatchRef,
            prevHeating, prevLatLong, lpf,
            geolocationTimeoutTime = 30000;

        var maxZoom = CONFIG.MAP.maxZoom,
            hideExpanderInDetails = CONFIG.OPTIONS.hideExpanderInDetails;

        var shareScope = $rootScope.$new(),
            shareModal;

        vm.userData = {};
        vm.goTo = Utils.goTo;

        vm.goToPoi = function (url) {
            var trackHistoryPosition = localStorage.$wm_track_history ? JSON.parse(localStorage.$wm_track_history) : 1;
            if (trackHistoryPosition <= 0) {
                localStorage.$wm_track_history = JSON.stringify(trackHistoryPosition - 1);
            }
            vm.goTo(url);
        };

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
            var showPopups = CONFIG.MAIN ? true : false;
            var onSuccess = function (e) {
                if (e) {
                    vm.dragged = true;
                    vm.gpsActive = true;
                    vm.centerOnMe();
                } else {
                    if (!showPopups) {
                        return;
                    }
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

            if (window.cordova && vm.showLocate && ($state.current.name === "app.main.map" || $state.current.name === "app.main.detailtaxonomy" || vm.isNavigable)) {
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
                        if (!showPopups) {
                            return;
                        }
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
                        },
                            onError,
                            cordova.plugins.diagnostic.locationAuthorizationMode.ALWAYS);
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

        vm.navigationAvailable = false;
        vm.isNavigating = false;
        vm.isPaused = false;
        vm.stopNavigationUrlParams = {
            parentId: null,
            id: null
        };

        vm.navigationStartTime = 0;
        vm.navigationStopTime = 0;
        vm.firstPositionSet = false;
        vm.lastPositionRecordTime = 0;

        vm.timeInMotion = 0;
        vm.timeInMotionBeforePause = 0;
        vm.timeInMotionText = '00:00';

        vm.distanceTravelled = 0;
        vm.distanceTravelledBeforePause = 0;
        vm.distanceTravelledText = '0.0 km';

        vm.currentSpeedExpireTimeout = null;
        vm.currentSpeedText = '0 km/h';
        vm.averageSpeedText = '0 km/h';
        vm.movingTime = 0;
        vm.isNotMoving = false;
        vm.navigationInterval = null;

        var realTimeTracking = {};
        realTimeTracking.enabled = (CONFIG.NAVIGATION && CONFIG.NAVIGATION.TRACKING && CONFIG.NAVIGATION.TRACKING.enableRealTimeTracking) ||
            (CONFIG.MAIN && CONFIG.MAIN.NAVIGATION && CONFIG.MAIN.NAVIGATION.TRACKING && CONFIG.MAIN.NAVIGATION.TRACKING.enableRealTimeTracking);
        realTimeTracking.url = "https://api.webmapp.it/services/share.php";

        realTimeTracking.positionsToSend = [];
        realTimeTracking.minPositionsToSend = 1;
        realTimeTracking.appUrl = CONFIG.COMMUNICATION.baseUrl;

        vm.routeId = CONFIG.routeID ? CONFIG.routeID : 0;

        if (CONFIG.MAIN && CONFIG.MAIN.NAVIGATION && CONFIG.MAIN.NAVIGATION.TRACKING && CONFIG.MAIN.NAVIGATION.realTimeTrackingUrl) {
            realTimeTracking.url = CONFIG.MAIN.NAVIGATION.TRACKING.realTimeTrackingUrl;
        }
        if (CONFIG.NAVIGATION && CONFIG.NAVIGATION.TRACKING && CONFIG.NAVIGATION.realTimeTrackingUrl) {
            realTimeTracking.url = CONFIG.NAVIGATION.TRACKING.realTimeTrackingUrl;
        }

        if (CONFIG.MAIN && CONFIG.MAIN.NAVIGATION && CONFIG.MAIN.NAVIGATION.TRACKING && CONFIG.MAIN.NAVIGATION.TRACKING.minPositionsToSend) {
            realTimeTracking.minPositionsToSend = CONFIG.MAIN.NAVIGATION.TRACKING.minPositionsToSend;
        }
        if (CONFIG.NAVIGATION && CONFIG.NAVIGATION.TRACKING && CONFIG.NAVIGATION.TRACKING.minPositionsToSend) {
            realTimeTracking.minPositionsToSend = CONFIG.NAVIGATION.TRACKING.minPositionsToSend;
        }

        if (CONFIG.COMMUNICATION.baseUrl) {
            realTimeTracking.appUrl = CONFIG.COMMUNICATION.baseUrl;
        }
        if (CONFIG.MAIN && CONFIG.MAIN.COMMUNICATION.baseUrl) {
            realTimeTracking.appUrl = CONFIG.MAIN.COMMUNICATION.baseUrl;
        }

        if (!Date.now) {
            Date.now = function () {
                return new Date().getTime();
            };
        }

        if (CONFIG.NAVIGATION && CONFIG.NAVIGATION.activate && !Utils.isBrowser()) {
            vm.navigationAvailable = true;
        }

        vm.deg = 0;
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

        var hexToRgbA = function (hex) {
            var c;
            if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
                c = hex.substring(1).split('');
                if (c.length == 3) {
                    c = [c[0], c[0], c[1], c[1], c[2], c[2]];
                }
                c = '0x' + c.join('');
                return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',0.8)';
            }
            return ('rgba(0,0,0,0.8)');
        }

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
        }

        vm.turnOffGeolocationAndRotion = function () {
            if (!vm.canFollow) {
                return;
            }

            vm.canFollow = false;

            if (vm.isRotating) {
                orientationWatchRef.clearWatch();
                vm.isRotating = false;
                MapService.mapIsRotating(vm.isRotating);
            }

            if (vm.followActive) {
                clearInterval(watchInterval);
            }

            vm.followActive = false;

            setTimeout(function () {
                MapService.setBearing(-359.95);
                MapService.setBearing(-359.97);
                MapService.setBearing(-359.99);
            }, 100);

            MapService.stopControlLocate();
        };

        vm.turnOffRotationAndFollow = function () {
            if (vm.isRotating) {
                orientationWatchRef.clearWatch();
                vm.isRotating = false;
                MapService.mapIsRotating(vm.isRotating);
            }

            vm.canFollow = false;
            vm.followActive = false;

            setTimeout(function () {
                MapService.setBearing(-359.95);
                MapService.setBearing(-359.97);
                MapService.setBearing(-359.99);
            }, 100);
        };

        var geolocationTimedOut = function (err) {
            console.log(err);
            console.log("Restarting geolocalization");
            watchInterval = $cordovaGeolocation.watchPosition({
                timeout: geolocationTimeoutTime,
                enableHighAccuracy: true
            });
            watchInterval.then(
                null,
                geolocationTimedOut,
                posCallback);
        };

        var posCallback = function (position) {
            var lat = position.coords.latitude ? position.coords.latitude : 0,
                long = position.coords.longitude ? position.coords.longitude : 0,
                altitude = position.coords.altitude ? position.coords.altitude : 0,
                locateLoading = false,
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

                if (vm.isNavigating && !vm.isPaused) {
                    if (realTimeTracking.enabled && vm.userData.ID) {
                        // vm.positionsToSend.push({
                        //     lat: lat,
                        //     lng: long,
                        //     altitude: altitude,
                        //     heading: position.coords.heading,
                        //     speed: position.coords.speed,
                        //     timestamp: position.timestamp
                        // });

                        realTimeTracking.positionsToSend.push([
                            long,
                            lat,
                            altitude
                            // ,
                            // position.timestamp,
                            // position.coords.speed,
                            // position.coords.heading
                        ]);

                        if (realTimeTracking.positionsToSend.length >= realTimeTracking.minPositionsToSend) {
                            var currentRequest = Communication.callAPI(realTimeTracking.url, {
                                type: "FeatureCollection",
                                features: [{
                                    type: "Feature",
                                    properties: {
                                        type: "tracking",
                                        app: realTimeTracking.appUrl,
                                        routeId: vm.routeId,
                                        trackId: vm.stopNavigationUrlParams.id,
                                        email: vm.userData.user_email,
                                        firstName: vm.userData.first_name,
                                        lastName: vm.userData.last_name
                                    },
                                    geometry: {
                                        type: "LineString",
                                        coordinates: realTimeTracking.positionsToSend
                                    }
                                }]
                            });

                            currentRequest
                                .then(function () {
                                    realTimeTracking.positionsToSend = [];
                                    return;
                                },
                                    function (error) {
                                        return;
                                    });
                        }
                    }

                    if (vm.firstPositionSet) {
                        updateNavigationValues(position, prevLatLong);
                    } else {
                        vm.firstPositionSet = true;
                        vm.lastPositionRecordTime = Date.now();
                        vm.isNotMoving = false;
                        vm.startMovingTime = Date.now();
                        vm.currentSpeedExpireTimeout = setTimeout(function () {
                            vm.currentSpeedText = '0 km/h';
                            vm.isNotMoving = true;
                            vm.movingTime = vm.movingTime + Date.now() - vm.startMovingTime;
                        }, 5000);
                    }

                    MapService.triggerNearestPopup({
                        lat: lat,
                        long: long
                    });
                }

                prevLatLong = {
                    lat: lat,
                    long: long
                };
            } else {
                MapService.drawAccuracy(position.coords.accuracy);
            }
        };

        vm.centerOnMe = function () {
            if (!vm.gpsActive) {
                checkGPS();
                return;
            }

            if (vm.locateLoading) {
                return;
            }

            if (vm.useExandMapInDetails && vm.detail && false) {
                MapService.stopControlLocate();
                MapService.getFeatureById($state.params.id, $rootScope.currentParams.parentId.replace(/_/g, ' '))
                    .then(function (feature) {
                        var featureLat = feature.geometry.coordinates[1],
                            featureLong = feature.geometry.coordinates[0];

                        vm.locateLoading = true;

                        $cordovaGeolocation
                            .getCurrentPosition({
                                timeout: geolocationTimeoutTime,
                                enableHighAccuracy: Utils.isBrowser() ? true : false
                            })
                            .then(function (position) {
                                var posLat = position.coords.latitude,
                                    posLong = position.coords.longitude;

                                var sw, ne;
                                if (!MapService.isInBoundingBox(posLat, posLong)) {
                                    vm.outsideBoundingBox = true;
                                    var showPopups = CONFIG.MAIN ? true : false;
                                    if (!showPopups) {
                                        return;
                                    }
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
                vm.canFollow = true;
                vm.followActive = true;
                MapService.centerOnCoords(prevLatLong.lat, prevLatLong.long);
                return;
            }

            if (prevLatLong && !vm.canFollow && !vm.followActive) {
                vm.canFollow = true;
                vm.followActive = true;
                MapService.centerOnCoords(prevLatLong.lat, prevLatLong.long);
                return;
            }

            if (vm.canFollow || vm.isRotating) {
                if (vm.isRotating) {
                    // vm.turnOffGeolocationAndRotion();
                    vm.turnOffRotationAndFollow();
                } else {
                    if (prevLatLong) {
                        MapService.centerOnCoords(prevLatLong.lat, prevLatLong.long);
                    }
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
                                MapService.mapIsRotating(vm.isRotating);
                            }
                            console.error(error);
                        },
                        function (result) {
                            if (!vm.canFollow) {
                                return;
                            }

                            if (!vm.isRotating) {
                                vm.isRotating = true;
                                MapService.mapIsRotating(vm.isRotating);
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
                    // vm.turnOffGeolocationAndRotion();
                    vm.turnOffRotationAndFollow();
                } else {
                    vm.locateLoading = true;
                    $cordovaGeolocation
                        .getCurrentPosition({
                            timeout: geolocationTimeoutTime,
                            enableHighAccuracy: Utils.isBrowser() ? true : false
                        })
                        .then(function (position) {
                            var lat = position.coords.latitude,
                                long = position.coords.longitude;

                            vm.locateLoading = false;

                            if (!MapService.isInBoundingBox(lat, long)) {
                                vm.isOutsideBoundingBox = true;
                                var showPopups = CONFIG.MAIN ? true : false;
                                if (!showPopups) {
                                    return;
                                }
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

                            if (Utils.isBrowser()) {
                                MapService.setZoom(maxZoom);
                            } else {
                                vm.canFollow = true;
                                vm.followActive = true;

                                if (CONFIG.OPTIONS.useIntervalInsteadOfWatch) {
                                    watchInterval = setInterval(function () {
                                        $cordovaGeolocation
                                            .getCurrentPosition({
                                                timeout: geolocationTimeoutTime,
                                                enableHighAccuracy: true
                                            })
                                            .then(posCallback);
                                    }, CONFIG.OPTIONS.intervalUpdateMs);
                                } else {
                                    watchInterval = $cordovaGeolocation.watchPosition({
                                        timeout: geolocationTimeoutTime,
                                        enableHighAccuracy: true
                                    });
                                    watchInterval.then(
                                        null,
                                        geolocationTimedOut,
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
            delete localStorage.$wm_track_history;
            vm.isNavigable = false;
            if ($state.params.parentId) {
                MapService.setFilter($state.params.parentId.replace(/_/g, " "), true);
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
            delete localStorage.$wm_track_history;
            vm.isMapPage = !vm.isMapPage;
            vm.mapView = vm.isMapPage;
            vm.isNavigable = false;
            setTimeout(function () {
                MapService.adjust();
            }, 350);
            MapService.adjust();
            $rootScope.$emit('expand-map', vm.isMapPage);
        };

        var getTimeText = function (time) {
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

        var getDistanceText = function (distance) {
            return (distance / 1000).toFixed(1) + ' km';
        };

        var updateNavigationValues = function (position, prevPosition) {
            var distance = distanceInMeters(position.coords.latitude, position.coords.longitude, prevPosition.lat, prevPosition.long)
            vm.distanceTravelled = distance + vm.distanceTravelled;
            if (vm.distanceTravelledBeforePause > 0) {
                vm.distanceTravelled = vm.distanceTravelled + vm.distanceTravelledBeforePause;
                vm.distanceTravelledBeforePause = 0;
            }
            vm.distanceTravelledText = getDistanceText(vm.distanceTravelled);

            var timeElapsedBetweenPositions = Date.now() - vm.lastPositionRecordTime;

            if (vm.isNotMoving) {
                vm.startMovingTime = Date.now();
                vm.isNotMoving = false;
            }

            vm.averageSpeedText = (vm.distanceTravelled / ((Date.now() - vm.startMovingTime + vm.movingTime) / 1000) * 3.6).toFixed(0) + ' km/h';

            vm.currentSpeedText = (distance / (timeElapsedBetweenPositions / 1000) * 3.6).toFixed(0) + ' km/h';
            clearTimeout(vm.currentSpeedExpireTimeout);
            vm.currentSpeedExpireTimeout = setTimeout(function () {
                vm.currentSpeedText = '0 km/h';
                vm.isNotMoving = true;
                vm.movingTime = vm.movingTime + Date.now() - vm.startMovingTime;
            }, 5000);

            vm.lastPositionRecordTime = Date.now();
        };

        var navigationIntervalFunction = function () {
            vm.timeInMotion = Date.now() - vm.navigationStartTime + vm.timeInMotionBeforePause;
            vm.timeInMotionText = getTimeText(vm.timeInMotion);
            Utils.forceDigest();
        };

        var cleanNavigationValues = function () {
            vm.navigationStartTime = 0;
            vm.navigationStopTime = 0;
            vm.firstPositionSet = false;
            vm.lastPositionRecordTime = 0;

            vm.timeInMotion = 0;
            vm.timeInMotionBeforePause = 0;
            vm.timeInMotionText = '00:00';

            vm.distanceTravelled = 0;
            vm.distanceTravelledBeforePause = 0;
            vm.distanceTravelledText = '0.0 km';

            vm.currentSpeedExpireTimeout = null;
            vm.currentSpeedText = '0 km/h';
            vm.averageSpeedText = '0 km/h';
            vm.movingTime = 0;
            vm.isNotMoving = false;
            vm.navigationInterval = null;
        };

        vm.startNavigation = function () {
            if (!vm.gpsActive) {
                checkGPS();
                return;
            }

            if (vm.isOutsideBoundingBox) {
                var showPopups = CONFIG.MAIN ? true : false;
                if (!showPopups) {
                    return;
                }
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

            vm.dragged = false;

            if (!prevLatLong && !vm.locateLoading) {
                vm.centerOnMe();
            }

            if (!vm.isRotating) {
                vm.canFollow = true;
                vm.followActive = true;
                vm.centerOnMe();
            }

            //Hide start button
            vm.isNavigable = false;

            //Start recording
            vm.isNavigating = true;
            vm.isPaused = false;
            vm.stopNavigationUrlParams.parentId = $rootScope.currentParams.parentId;
            vm.stopNavigationUrlParams.id = $rootScope.currentParams.id;

            vm.navigationStartTime = Date.now();

            vm.navigationInterval = setInterval(navigationIntervalFunction, 1000);
            $rootScope.$emit('is-navigating', vm.isNavigating);
            $rootScope.$emit('navigation-path', vm.stopNavigationUrlParams);

            setTimeout(function () {
                if (prevLatLong) {
                    MapService.triggerNearestPopup({
                        lat: prevLatLong.lat,
                        long: prevLatLong.long
                    });
                }
            }, 1000);

            Utils.goTo('/');
        };

        vm.pauseNavigation = function () {
            vm.isPaused = true;
            vm.timeInMotionBeforePause = Date.now() - vm.navigationStartTime + vm.timeInMotionBeforePause;
            vm.distanceTravelledBeforePause = vm.distanceTravelled;
            clearInterval(vm.navigationInterval);
        };

        vm.resumeNavigation = function () {
            vm.isPaused = false;
            vm.navigationStartTime = Date.now();
            vm.navigationInterval = setInterval(navigationIntervalFunction, 1000);
            vm.distanceTravelled = 0;
            vm.firstPositionSet = false;
        };

        vm.stopNavigation = function () {
            vm.isPaused = false;
            vm.isNavigating = false;
            clearInterval(vm.navigationInterval);
            cleanNavigationValues();
            $rootScope.$emit('is-navigating', vm.isNavigating);
            if (vm.stopNavigationUrlParams.parentId && vm.stopNavigationUrlParams.id) {
                var url = 'layer/' + vm.stopNavigationUrlParams.parentId + '/' + vm.stopNavigationUrlParams.id;
                vm.stopNavigationUrlParams = {
                    parentId: null,
                    id: null
                };
                Utils.goTo(url);
            }
        };

        var showPathAndRelated = function (params) {
            var parentId = params.parentId,
                id = params.id;

            MapService.resetLayers();
            MapService.getFeatureById(id, parentId.replace(/_/g, ' '))
                .then(function (data) {
                    var featuresToShow = [data];

                    if (data.properties.id_pois) {
                        var related = MapService.getRelatedFeaturesById(data.properties.id_pois);
                        for (var i in related) {
                            if (related[i] && related[i].properties) {
                                featuresToShow = featuresToShow.concat([related[i]]);
                            }
                        }
                    }

                    MapService.addFeaturesToFilteredLayer({
                        'detail': featuresToShow
                    }, false);
                    setTimeout(function () {
                        MapService.adjust();
                    }, 2500);
                });
        };

        $scope.$on('$stateChangeStart', function (e, dest) {
            if (vm.taxonomyName) {
                delete vm.taxonomyName;
                delete vm.itemColor;
            }

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

            if (currentState !== 'app.main.map') {
                // vm.turnOffGeolocationAndRotion();
                vm.turnOffRotationAndFollow();
            }
            MapService.removePositionMarker();
            // MapService.enableClustering();

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

            vm.hideMap = false;
            vm.mapView = false;

            if (currentState === 'app.main.map') {
                vm.mapView = true;
                vm.hideExpander = true;
                setTimeout(function () {
                    if (vm.stopNavigationUrlParams.parentId && vm.stopNavigationUrlParams.id) {
                        showPathAndRelated(vm.stopNavigationUrlParams);
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
                layerState = true;
                // vm.hideExpander = true;

                if (typeof overlayMap[realState] !== 'undefined' ||
                    typeof overlaysGroupMap[realState] !== 'undefined') {

                    setTimeout(function () {
                        if (layerState) {
                            MapService.activateLayer(realState, false, false);
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
                // MapService.disableClustering();
                // TODO: check the shadow
                // else {
                //     vm.hasShadow = true;
                // }

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
            } else if (currentState === 'app.main.chiantiHome') {
                vm.hideMap = true;
                vm.hasShadow = true;
                vm.extendShadow = true;
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
            if (vm.isRotating) {
                vm.turnOffRotationAndFollow();
            }
            vm.dragged = true;
        });

        $rootScope.$on('item-navigable', function (e, value) {
            vm.isNavigable = value;
        });

        $rootScope.$on('taxonomy-details', function (e, value) {
            vm.isAPoi = false;
            vm.taxonomyName = value.name;
            vm.itemColor = hexToRgbA(value.color);
            vm.activityIcon = value.icon;
            if (MapService.isAPOILayer($rootScope.currentParams.parentId.replace(/_/g, ' '))) {
                MapService.getFeatureById($rootScope.currentParams.id, $rootScope.currentParams.parentId.replace(/_/g, ' '))
                    .then(function (feature) {
                        if (feature === null) {
                            vm.isAPoi = false;
                        }
                        else {
                            var track = MapService.getRelatedTrackByFeatureId(feature.properties.id);
                            var features = MapService.getRelatedFeaturesById(track.properties.id_pois);
                            vm.parentTrackName = track.properties.name;
                            for (var pos in features) {
                                if (features[pos].properties.id * 1 === $rootScope.currentParams.id * 1) {
                                    var intPos = pos * 1;
                                    if (intPos === 0) {
                                        vm.prevUrl = 'layer/' + features[features.length - 1].parent.label.replace(/ /g, '_') + '/' + features[features.length - 1].properties.id;
                                    }
                                    else {
                                        vm.prevUrl = 'layer/' + features[intPos - 1].parent.label.replace(/ /g, '_') + '/' + features[intPos - 1].properties.id;
                                    }

                                    if (intPos === features.length - 1) {
                                        vm.nextUrl = 'layer/' + features[0].parent.label.replace(/ /g, '_') + '/' + features[0].properties.id;
                                    }
                                    else {
                                        vm.nextUrl = 'layer/' + features[intPos + 1].parent.label.replace(/ /g, '_') + '/' + features[intPos + 1].properties.id;
                                    }
                                    break;
                                }
                            }
                        }
                    });
                vm.isAPoi = true;
            }
        });

        $rootScope.$on('geolocate', function () {
            vm.dragged = true;
            vm.centerOnMe();
        });

        window.addEventListener('orientationchange', function () {
            vm.isLandscape = isLandscape();
        });

        $ionicPlatform.ready(function () {
            vm.userData = Auth.getUserData();
            checkGPS();
            if (window !== top) {
                MapService.disableWheelZoom();
            }
        });

        return vm;
    });