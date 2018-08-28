/*global angular*/

angular.module('webmapp')

    .factory('Account', function Account(
        $http,
        $q,
        $cordovaOauth,
        Auth,
        CONFIG
    ) {
        var account = {};

        var config = CONFIG,
            baseUrl = config.COMMUNICATION.baseUrl,
            endpoint = config.COMMUNICATION.endpoint,
            wordPressEndpoint = config.COMMUNICATION.wordPressEndpoint;

        account.refreshCard = function () {
            var defer = $q.defer();

            var userData = Auth.getUserData(),
                token = userData.api_token,
                sessionId = userData.sessid;

            $http({
                method: 'POST',
                url: baseUrl + endpoint + 'get-user-card',
                dataType: 'json',
                data: {},
                crossDomain: true,
                headers: {
                    'Content-Type': 'application/json',
                    'X-USER-SESSION-TOKEN': sessionId,
                    'X-CSRF-Token': token
                }
            }).success(function (data) {
                if (data.card !== '') {
                    userData.card = {
                        value: data.card
                    };
                    Auth.setUserData(userData);
                }
                defer.resolve(data.card);
            }).error(function (error) {
                defer.reject(error);
            });

            return defer.promise;
        };

        account.generateCard = function (cardId) {
            var defer = $q.defer(),
                data = {};

            var userData = Auth.getUserData(),
                token = userData.api_token,
                sessionId = userData.sessid;

            if (cardId) {
                data.card_id = cardId;
            }

            $http({
                method: 'POST',
                url: baseUrl + endpoint + 'generate-new-card',
                dataType: 'json',
                crossDomain: true,
                data: data,
                headers: {
                    'Content-Type': 'application/json',
                    'X-USER-SESSION-TOKEN': sessionId,
                    'X-CSRF-Token': token
                }
            }).success(function (data) {
                userData.card = data || {};

                // TODO: fix it server side
                if (typeof data.card === 'string') {
                    userData.card.value = data.card;
                }

                Auth.setUserData(userData);
                defer.resolve(data);
            }).error(function (error) {
                defer.reject(error);
            });

            return defer.promise;
        };

        account.socialLogin = function (socialType) {
            var defer = $q.defer(),
                secondArgument;

            if (typeof config.COMMUNICATION[socialType + 'Id'] !== 'undefined') {
                if (socialType === 'twitter') {
                    secondArgument = config.COMMUNICATION[socialType + 'Secret'];
                } else {
                    secondArgument = ['email'];
                }

                $cordovaOauth[socialType](config.COMMUNICATION[socialType + 'Id'], secondArgument)
                    .then(function (result) {
                        var data = {
                            provider_id: socialType
                        };

                        if (socialType === 'twitter') {
                            data.token = result.oauth_token;
                            data.token_secret = result.oauth_token_secret;
                        } else {
                            data.token = result.access_token;
                        }

                        $http({
                            method: 'POST',
                            url: baseUrl + endpoint + 'auth-social-user',
                            dataType: 'json',
                            crossDomain: true,
                            data: data,
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }).success(function (data) {
                            // console.log('auth-social-user', data);
                            defer.resolve(data);
                        }).error(function (error) {
                            // console.error('auth-social-user', error);
                            defer.reject(error);
                        });
                    }, function () {
                        defer.reject();
                    });
            } else {
                defer.reject();
            }

            return defer.promise;
        };

        account.logout = function () {
            var defer = $q.defer();

            var userData = Auth.getUserData(),
                token = userData.api_token,
                sessionId = userData.sessid;

            $http({
                method: 'POST',
                url: baseUrl + endpoint + 'user/logout',
                dataType: 'json',
                crossDomain: true,
                headers: {
                    'Content-Type': 'application/json',
                    'X-USER-SESSION-TOKEN': sessionId,
                    'X-CSRF-Token': token
                }
            }).success(function (data) {
                defer.resolve(data);
            }).error(function (error) {
                defer.reject(error);
            });

            Auth.setUserData({});

            return defer.promise;
        };

        account.resetPassword = function (email) {
            var defer = $q.defer();

            $http({
                method: 'POST',
                url: baseUrl + endpoint + 'user/token',
                dataType: 'json',
                crossDomain: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            }).success(function (data) {
                $http({
                    method: 'POST',
                    url: baseUrl + endpoint + 'user/request_new_password',
                    dataType: 'json',
                    crossDomain: true,
                    data: {
                        name: email
                    },
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': data.token
                    }
                }).success(function (data) {
                    defer.resolve(data);
                }).error(function (error) {
                    defer.reject(error);
                });
            }).error(function (error) {
                defer.reject(error);
            });

            return defer.promise;
        };

        account.login = function (username, password) {
            var defer = $q.defer();

            $http({
                method: 'POST',
                url: baseUrl + endpoint + 'user/',
                dataType: 'json',
                crossDomain: true,
                data: {
                    user: username,
                    pass: password
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).success(function (data) {
                defer.resolve(data);
            }).error(function (error) {
                defer.reject(error);
            });

            return defer.promise;
        };

        account.createAccount = function (firstName, lastName, email, password, country, newsl, isWordpress) {
            var defer = $q.defer(),
                data = {
                    user: email,
                    pass: password,
                    mail: email,
                    appname: config.OPTIONS.title,
                    first_name: firstName,
                    last_name: lastName,
                    newsletter: newsl,
                    country: country
                };

            $http({
                method: 'POST',
                url: baseUrl + endpoint + 'users',
                dataType: 'json',
                crossDomain: true,
                data: data,
                headers: {
                    'Content-Type': 'application/json'
                }
            }).success(function (data) {
                defer.resolve(data);
            }).error(function (error) {
                defer.reject(error);
            });

            return defer.promise;
        };

        account.updateAdditionalInfo = function (updateData) {
            var defer = $q.defer();

            var userData = Auth.getUserData(),
                token = userData.api_token,
                sessionId = userData.sessid;

            $http({
                method: 'PUT',
                url: baseUrl + endpoint + 'user/' + userData.user.uid,
                dataType: 'json',
                data: updateData,
                crossDomain: true,
                headers: {
                    'Content-Type': 'application/json',
                    'X-USER-SESSION-TOKEN': sessionId,
                    'X-CSRF-Token': token
                }
            }).success(function (data) {
                angular.extend(userData.user, data);
                Auth.setUserData(userData);
                defer.resolve(data);
            }).error(function (error) {
                defer.reject(error);
            });

            return defer.promise;
        };

        account.hasAdditionalInfo = function () {
            if (!Auth.isLoggedIn()) {
                return;
            }

            var userData = Auth.getUserData(),
                user = userData.user,
                result = true;

            var fieldsToCheck = [
                'field_city',
                'field_birthday',
                'field_gender',
                'field_user_type'
            ],
                fieldsCheck = true;

            for (var i in fieldsToCheck) {
                if (typeof user[fieldsToCheck[i]] === 'undefined') {
                    fieldsCheck = false;
                    break;
                }
            }

            if (fieldsCheck) {
                if (typeof user.field_city.und === 'undefined') {
                    result = false;
                }

                if (typeof user.field_birthday.und === 'undefined') {
                    result = false;
                }

                if (typeof user.field_gender.und === 'undefined') {
                    result = false;
                }

                if (typeof user.field_user_type.it === 'undefined') {
                    result = false;
                }
            }

            return result;
        };

        account.checkin = function (location) {
            var defer = $q.defer();

            var userData = Auth.getUserData(),
                token = userData.api_token,
                sessionId = userData.sessid;

            if (location && location.lat && location.long) {
                $http({
                    method: 'POST',
                    url: baseUrl + endpoint + 'user-checkin',
                    dataType: 'json',
                    data: {
                        lat: location.lat,
                        long: location.long,
                        uid: userData.user.uid
                    },
                    crossDomain: true,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-USER-SESSION-TOKEN': sessionId,
                        'X-CSRF-Token': token
                    }
                }).success(function (data) {
                    defer.resolve(data);
                }).error(function (error) {
                    defer.reject(error);
                });
            } else {
                defer.reject();
            }


            return defer.promise;
        };

        return account;
    });