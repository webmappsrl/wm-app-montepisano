angular.module('webmapp')

.controller('CardController', function CardController(
    $window,
    $rootScope,
    $ionicPopup,
    $ionicPlatform,
    $cordovaBarcodeScanner,
    $cordovaNetwork,
    $cordovaGeolocation,
    $ionicLoading,
    Account,
    Auth,
    Utils
) {
    var vm = {};

    var acceptedFormat = 'CODE_39',
        userData = Auth.getUserData();

    var posOptions = {
        timeout: 10000,
        enableHighAccuracy: false
    };

    if (Auth.isLoggedIn() && !userData.card.value) {
        Account.refreshCard();
    }

    // if (Utils.isBrowser()) {
    //     Utils.goTo('/');
    // }

    vm.isBrowser = Utils.isBrowser();
    vm.goBack = Utils.goBack;
    vm.loading = false;
    vm.insertMode = false;

    var setLoading = function(active) {
        if (active) {
            $ionicLoading.show({
                template: 'Loading...'
            });
        } else {
            $ionicLoading.hide();
        }
    };

    var isValid = function(text, format) {
        if (format !== acceptedFormat) {
            return false;
        }

        if (typeof text !== 'string') {
            return false;
        }

        if (!(text.length > 6 && text.length < 11)) {
            return false;
        }

        if (text.substring(0, 2) !== 'VC') {
            return false;
        }

        return true;
    };

    var showAlert = function(text, format) {
        var message = '',
            valid = false;

        if (typeof text === 'string') {
            if (isValid(text, format)) {
                message = 'Card scansionata correttamente';
                valid = true;
            } else {
                message = 'Card non valida, riprova';
            }
        } else {
            message = 'Qualcosa è andato storto, riprova';
        }

        $ionicPopup.alert({
            title: valid ? 'Fatto' : 'Attenzione',
            template: message,
            buttons: [{
                text: 'Ok',
                type: 'button-positive'
            }]
        });
    };

    var generateCard = function(cardText, forceGenerate) {
        if (!Account.hasAdditionalInfo() && !forceGenerate) {
            vm.insertMode = true;
            return;
        }

        setLoading(true);
        Account.generateCard(cardText)
            .then(function(data) {
                $ionicPopup.alert({
                    title: 'FATTO',
                    template: !cardText ? 'Card generata correttamente' : 'Card scansionata correttamente',
                    buttons: [{
                        text: 'Ok',
                        type: 'button-positive'
                    }]
                });
                setLoading(false);
                userData.card = data;
                vm.hasCard = true;
            }, function(error) {
                $ionicPopup.alert({
                    title: 'ATTENZIONE',
                    template: error,
                    buttons: [{
                        text: 'Ok',
                        type: 'button-positive'
                    }]
                });
                setLoading(false);
            });
    };

    if (userData.card && typeof userData.card.value === 'string') {
        vm.hasCard = true;
        Utils.forceDigest();
    }

    vm.marginTop = (window.innerHeight / 2) - (67 / 2);

    vm.barcodeInit = function() {
        if (vm.hasCard) {
            setTimeout(function() {
                JsBarcode('#barcode', userData.card.value || userData.card.card, {
                    format: 'CODE39',
                    lineColor: 'black'
                        // width: 4,
                        // height: 40,
                        // displayValue: false
                });
            });
        }
    };

    vm.generateNewCard = function() {
        if ($cordovaNetwork.isOffline()) {
            $ionicPopup.alert({
                title: 'ATTENZIONE',
                template: 'Collegati a Internet per associare una card al tuo profilo',
                buttons: [{
                    text: 'Ok',
                    type: 'button-positive'
                }]
            });
            return;
        }
        generateCard();
    };

    vm.checkin = function() {
        setLoading(true);

        $cordovaGeolocation.getCurrentPosition(posOptions)
            .then(function(location) {
                var locationInfo = {
                    lat: location.coords.latitude,
                    long: location.coords.longitude
                };
                
                Account.checkin(locationInfo)
                    .then(function() {
                        $ionicPopup.alert({
                            title: 'COMPLIMENTI',
                            template: 'Grazie per aver effettuato il check-in',
                            buttons: [{
                                text: 'Ok',
                                type: 'button-positive'
                            }]
                        });
                        setLoading(false);
                    }, function() {
                        setLoading(false);
                    });
            }, function() {
                setLoading(false);
            });

    };

    vm.scan = function() {
        if (!vm.scanning) {
            vm.scanning = true;
            $ionicPlatform.ready(function() {
                var posOptions = {
                    timeout: 10000,
                    enableHighAccuracy: false
                };

                $cordovaBarcodeScanner
                    .scan()
                    .then(function(result) {
                        vm.scanning = false;

                        if (result.text) { // result.format && result.cancelled
                            if (isValid(result.text, result.format)) {
                                generateCard(result.text, true);
                            } else {
                                showAlert();
                            }
                        }
                    }, function() {
                        vm.scanning = false;

                        // An error occurred
                        showAlert();
                    });
            });
        }
    };

    vm.completeProfile = function(userGender, userCity, userDate, userType) {
        if (!userGender || !userCity || !userDate || !userType) {
            return;
        }

        var data = {
            field_city: {
                und: [{
                    value: ''
                }]
            },
            field_birthday: {
                und: [{
                    value: {
                        date: ''
                    }
                }]
            },
            field_gender: {
                und: ''
            },
            field_user_type: {
                it: ''
            }
        };

        var buildDate = function(date) {
            var currentDate = new Date(date);
            
            return (currentDate.getMonth() +1) + '/' + currentDate.getDate() + '/' + currentDate.getFullYear();
        };

        data.field_city.und[0].value = userCity;
        data.field_birthday.und[0].value.date = buildDate(userDate);
        data.field_gender.und = userGender;
        data.field_user_type.it = userType;

        vm.loading = true;

        Account.updateAdditionalInfo(data)
            .then(function() {
                vm.loading = false;
                vm.insertMode = false;
                generateCard(undefined, true);
            }, function() {
                vm.loading = false;
                vm.insertMode = false;

                $ionicPopup.alert({
                    title: 'ATTENZIONE',
                    template: 'Qualcosa è andato storto',
                    buttons: [{
                        text: 'Ok',
                        type: 'button-positive'
                    }]
                });
            });
    };

    $rootScope.$on('logged-in', function() {
        userData = Auth.getUserData();
        if (userData.card && typeof userData.card.value === 'string') {
            vm.hasCard = true;
            Utils.forceDigest();
        }
        vm.barcodeInit();
    });

    // $ionicPlatform.ready(function() {
    //     $rootScope.$on('$cordovaNetwork:online', function() {
    //         var queue = [];

    //         if (typeof $window.localStorage.queue === 'string') {
    //             queue = JSON.parse($window.localStorage.queue);
    //             delete $window.localStorage.queue;

    //             for (var i in queue) {
    //                 Card.sendData(queue[i].card_code, queue[i].field_position, queue[i].created);
    //             }
    //         }
    //     });
    // });

    return vm;
});