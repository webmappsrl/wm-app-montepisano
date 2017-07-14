/*global angular*/

angular.module('webmapp')

.factory('Auth', function Auth(
    $window
) {
    var auth = {};

    auth.setUserData = function(value) {
        $window.localStorage.user = JSON.stringify(value);
    };

    auth.resetUserData = function() {
        delete $window.localStorage.user;
    };

    auth.getUserData = function() {
        var userData = {};

        if (typeof $window.localStorage.user === 'string') {
            userData = JSON.parse($window.localStorage.user);
        }

        return userData;
    };

    auth.isLoggedIn = function() {
        var dataUser = this.getUserData();
        return typeof dataUser === 'object' &&
            typeof dataUser.ID !== 'undefined';
            // dataUser.token &&
            // dataUser.sessid;
    };

    return auth;
});