/*global angular*/

angular.module('webmapp')

    .factory('Auth', function Auth(
        $rootScope,
        MapService
    ) {
        var auth = {};

        var userData = {},
            isLoggedIn = false;

        var init = function () {
            if (localStorage.user) {
                userData = JSON.parse(localStorage.user);
                isLoggedIn = true;
                MapService.setItemInLocalStorage("$wm_userData", JSON.stringify(userData));
                delete localStorage.user;
            }

            MapService.getItemFromLocalStorage("$wm_userData")
                .then(function (data) {
                    if (data.data && typeof data.data === 'string') {
                        userData = JSON.parse(data.data);
                        isLoggedIn = true;
                        $rootScope.$emit('logged-in');
                    }
                    else {
                        isLoggedIn = false;
                    }
                })
                .catch(function (err) {
                    console.warn(err)
                    isLoggedIn = false;
                });
        };

        auth.setUserData = function (value) {
            userData = value;
            MapService.setItemInLocalStorage("$wm_userData", JSON.stringify(value));
            isLoggedIn = true;
        };

        auth.resetUserData = function () {
            MapService.removeItemFromLocalStorage("$wm_userData");
            isLoggedIn = false;
        };

        auth.getUserData = function () {
            return userData;
        };

        auth.isLoggedIn = function () {
            return isLoggedIn;
        };

        init();

        return auth;
    });