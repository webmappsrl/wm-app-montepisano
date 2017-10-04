angular.module('webmapp')

.controller('PackagesController', function CouponController(
    $http,
    $q,
    $scope,
    $ionicPlatform,
    $rootScope,
    $ionicPopup,
    $ionicModal,
    $ionicLoading,
    Model,
    Offline,
    Auth,
    Communication,
    Utils,
    CONFIG
) {
    var vm = {},
        userData = {};

    var modalScope = $rootScope.$new(),
        modal = {},
        modalDownloadScope = $rootScope.$new(),
        modalDownload = {};

    var config = CONFIG,
        baseUrl = config.COMMUNICATION.baseUrl,
        endpoint = config.COMMUNICATION.endpoint;

    var communicationConf = CONFIG.COMMUNICATION;

    var updateDownloadedPackagesInStorage = function() {
        localStorage.$wm_userDownloadedPackages = JSON.stringify(vm.userDownloadedPackages);
    };

    var showPopup = function(template) {
        // TODO ...
    };

    var getPackagesIdByUserId = function(id) {
        return $.getJSON(baseUrl + endpoint + 'route_id/' + id, function(data) {
            vm.userPackagesId = {};

            for (var key in data) {
                vm.userPackagesId[key] = true;
            }

            localStorage.$wm_userPackagesId = JSON.stringify(vm.userPackagesId);
            Utils.forceDigest();

            return data;
        }).fail(function() {
            console.error('routes retrive error');
            return 'routes retrive error';
        });
    };

    var getRoutes = function(){
        $.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + 'route/', function(data) {
            vm.packages = data;

            localStorage.$wm_packages = JSON.stringify(data);

            // TODO: download images

            $ionicLoading.hide();
            Utils.forceDigest();
        }).fail(function() {
            console.error('routes retrive error');
            if (vm.packages.length === 0) {
                // TODO: controllare se non si hanno pacchetti per mancanza di connessione
            }
        });
    };

    // TODO: check if a map is not setted ready but there is a folder and delete it

    modalScope.vm = {};
    modalScope.vm.hide = function() {
        modal && modal.hide();
    };

    modalDownloadScope.vm = {};
    modalDownloadScope.vm.hide = function() {
        modalDownload && modalDownload.hide();
    };

    vm.userDownloadedPackages = localStorage.$wm_userDownloadedPackages ? JSON.parse(localStorage.$wm_userDownloadedPackages) : {};
    vm.packages = localStorage.$wm_packages ? JSON.parse(localStorage.$wm_packages) : [];
    vm.userPackagesId = localStorage.$wm_userPackagesId ? JSON.parse(localStorage.$wm_userPackagesId) : {};
    vm.userPackagesIdRquested = localStorage.$wm_userPackagesIdRquested ? JSON.parse(localStorage.$wm_userPackagesIdRquested) : {};

    vm.isLoggedIn = Auth.isLoggedIn();
    vm.isBrowser = Utils.isBrowser();
    vm.openInAppBrowser = Utils.openInAppBrowser;
    vm.pageConf = Model.getPage('Pacchetti');

    if (Auth.isLoggedIn()) {
        if (vm.packages.length === 0) {
            $ionicLoading.show({
                template: 'Loading...'
            });
        }

        userData = Auth.getUserData();
        getPackagesIdByUserId(userData.ID);
    } else {
        setTimeout(function() {
            showLogin();
        }, 500);
    }

    getRoutes();

    $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/detailMapModal.html', {
        scope: modalScope,
        animation: 'slide-in-up'
    }).then(function(modalObj) {
        modal = modalObj;
    });

    $ionicModal.fromTemplateUrl(templateBasePath + 'js/modals/downloadModal.html', {
        scope: modalDownloadScope,
        animation: 'slide-in-up'
    }).then(function(modalObj) {
        modalDownload = modalObj;
    });

    vm.openPackage = function(pack) {
        var basePackUrl = Offline.getOfflineMhildBasePathById(pack.id);

        Communication.getLocalFile(basePackUrl + 'config.json')
            .then(function(data) {
                localStorage.$wm_mhildConf = data;
                localStorage.$wm_mhildBaseUrl = Offline.getOfflineMhildBasePathById(pack.id);
                localStorage.$wm_mhildId = pack.id;

                sessionStorage.$wm_doBack = 'allowed';

                $ionicLoading.show({
                    template: 'Loading...'
                });

                location.reload();
                Utils.forceDigest();
            });
    };

    vm.openLoginOrRegistration = function(isRegistration) {
        showLogin(isRegistration);
    };

    vm.logout = function() {
        var confirmPopup = $ionicPopup.confirm({
            title: 'LOGOUT',
            template: 'Sei sicuro di voler effettuare il logout?'
        });

        confirmPopup.then(function(res) {
            if (res) {
                for (var i in vm.userDownloadedPackages) {
                    Offline.removePackById(i);
                }

                delete vm.userPackages;
                delete vm.userDownloadedPackages;
                delete localStorage.$wm_userPackages;
                delete localStorage.$$wm_userDownloadedPackages;

                Auth.resetUserData();
                $rootScope.isLoggedIn = vm.isLoggedIn = false;
                showLogin();
                Utils.forceDigest();
            }
        });
    };

    vm.downloadPack = function(pack) {
        $ionicPopup.confirm({
            title: 'ATTENZIONE',
            template: 'Stai per scaricare l\'itinerario sul dispositivo, vuoi procedere ?'
        })
        .then(function(res) {
            if (res) {
                var currentId = pack.id;

                if (typeof currentId === 'undefined') {
                    // TODO: add ionic alert
                    alert('Errore, effettuare logout');
                    return;
                }

                $.getJSON(CONFIG.COMMUNICATION.downloadJSONUrl + currentId + '/app.json', function(data) {

                    var arrayLink = [];

                    var downloadSuccess = function() {
                        modalDownload.hide();
                        vm.userDownloadedPackages[currentId] = true;
                        updateDownloadedPackagesInStorage();
                    };

                    var downloadFail = function() {
                        // TODO: add ionic alert
                        // TODO: rimuovere cartella, verificare interuzzione altri dowload
                        alert('Si è verificato un errore nello scaricamento del pacchetto, riprova');
                        modalDownload.hide();
                        // updateDownloadedPackagesInStorage();
                    };

                    for (var i in data) {
                        if (typeof data[i] === 'string') {
                            arrayLink.push(data[i]);
                        } else if (typeof data[i] === 'object') {
                            for (var j in data[i]) {
                                arrayLink.push(data[i][j]);
                            }
                        }
                    }

                    modalDownload.show();

                    Offline
                        .downloadUserMap(currentId, arrayLink, modalDownloadScope.vm)
                        .then(downloadSuccess, downloadFail);
                }).fail(function() {
                    // TODO: add ionic alert
                    alert('Si è verificato un errore nello scaricamento del pacchetto, assicurati di essere online e riprova');
                });
            }
        });
    };

    vm.removePack = function(item) {
        $ionicPopup.confirm({
                title: 'ATTENZIONE',
                template: 'Stai per rimuovere l\'itinerario dal dispositivo, vuoi procedere ? <br /> ' +
                'Questo itinerario è riservato ai clienti Verde Natura che hanno acquistato questo viaggio. Terminata la fase di sperimentazione, gli itinerari saranno disponibili a tutti"'
            })
            .then(function(res) {
                if (res) {
                    Offline.removePackById(item.id);
                    delete vm.userDownloadedPackages[item.id];
                    Utils.forceDigest();
                }
            });
    };

    vm.requestPack = function(item) {
        $ionicPopup
            .confirm({
                title: 'ATTENZIONE',
                template: 'Stai per richiedere accesso al download dell\'itinerario, intendi proseguire?'
            })
            .then(function(res) {
                if (res) {
                    var data = {
                        email: userData.user_email,
                        pack: item.id,
                        appname: config.OPTIONS.title
                    };

                    if (vm.userPackagesIdRquested[item.id]) {
                        return;
                    }

                    $ionicLoading.show({
                        template: 'Loading...'
                    });

                    $http({
                        method: 'POST',
                        url: baseUrl + endpoint + 'mail',
                        dataType: 'json',
                        crossDomain: true,
                        data: data,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).success(function(data) {
                        $ionicPopup.alert({
                            template: 'La richiesta è stata inviata, verrà processata al più presto'
                        });
                        vm.userPackagesIdRquested[item.id] = true;
                        localStorage.$wm_userPackagesIdRquested = JSON.stringify(vm.userPackagesIdRquested);
                        $ionicLoading.hide();
                    }).error(function(error) {
                        $ionicPopup.alert({
                            template: 'Si è verificato un errore durante la richiesta, riprova'
                        });
                        $ionicLoading.hide();
                        console.error(error);
                    });

                    return data;
                }
            });
    };

    vm.openDetailsRoute = function(id) {
        Utils.goTo('route/' + id);
    };

    vm.doRefresh = function(refresher) {
        console.log('Begin async operation', refresher);

        getRoutes();

        getPackagesIdByUserId(userData.ID)
            .then(function() {
                setTimeout(function() {
                    $scope.$broadcast('scroll.refreshComplete');
                }, 2000);
            }, function(){
                $ionicPopup.alert({
                    template: 'Si è verificato un errore di connessione, riprova più tardi'
                });
                $scope.$broadcast('scroll.refreshComplete');
            });

        location.reload();
    };

    $ionicPlatform.ready(function() {
        $ionicPlatform.on('resume', function() {
            if (Auth.isLoggedIn()) {
                userData = Auth.getUserData();
                getPackagesIdByUserId(userData.ID);
            }
        });

    });

    $rootScope.$on('logged-in', function() {
        if (Auth.isLoggedIn()) {
            userData = Auth.getUserData();
            vm.isLoggedIn = true;
            vm.userDownloadedPackages = {};
            getPackagesIdByUserId(userData.ID);
            Utils.forceDigest();

            if (vm.packages.length === 0) {
                $ionicLoading.show({
                    template: 'Loading...'
                });
            }
        }
    });



    function showLogin(isRegistration) {
        $rootScope.showLogin(isRegistration);
    }

    return vm;
});