angular.module('webmapp')

.controller('WelcomeController', function WelcomeController(
    $location,
    $rootScope,
    MapService,
    Model,
    Utils,
    CONFIG,
    $translate
) {
    var vm = {},
        baseUrl = '',
        menuItems = {
            label: 'Welcome',
            top: [
                $translate.instant("Cosa fare"),
                $translate.instant("Percorsi"),
                $translate.instant("Eventi")
            ],
            bottom: [
                $translate.instant("Card"),
                $translate.instant("Offerte")
            ]
        },
        menuMap = Model.getMenuMap();

    // console.log(menuMap)

    if (document.getElementsByTagName('base').length > 0) {
        baseUrl = document.getElementsByTagName('base')[0].href;
        baseUrl = baseUrl.slice(0, -1);
    }

    vm.goTo = Utils.goTo;
    vm.menuItems = {};
    vm.menuItems.top = {};
    vm.menuItems.bottom = {};

    for (var i in menuItems.top) {
        vm.menuItems.top[menuItems.top[i]] = menuMap[menuItems.top[i]];
        vm.menuItems.top[menuItems.top[i]].url = Model.buildItemUrl(menuMap[menuItems.top[i]]);
    }
    // for (var j in menuItems.bottom) {
    //     vm.menuItems.bottom[menuItems.bottom[i]] = menuMap[menuItems.bottom[i]];
    //     vm.menuItems.bottom[menuItems.bottom[i]].url = Model.buildItemUrl(menuMap[menuItems.bottom[i]]);
    // }

    vm.goToSubLayer = function(path, event) {
        event.stopPropagation();
        event.preventDefault();

        Utils.goTo(path);
    };

    vm.openLoginOrRegistration = function(isRegistration) {
        $rootScope.showLogin(isRegistration);
    };

    return vm;
});