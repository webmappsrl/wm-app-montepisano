describe('Account.Factory', function () {
    beforeEach(module('webmapp'));
    var accountService;
    var Auth;
    var $httpBackend;
    var $q;
    var $rootScope;
    var config;
    var baseUrl, endpoint;

    beforeEach(inject(function (Account, _$httpBackend_, _$q_, _$rootScope_, _Auth_, CONFIG) {
        accountService = Account;
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
        $q = _$q_;
        Auth = _Auth_;

        config = CONFIG;

        baseUrl = config.COMMUNICATION.baseUrl;
        endpoint = config.COMMUNICATION.endpoint;

        $httpBackend.whenGET().respond(404);
    }));

    describe('.login', function () {
        it('it should execute login successfully', function (done) {
            var fakeUser = 'fakeUser';
            var fakePass = 'fakePass';
            var data = {
                user: fakeUser,
                pass: fakePass
            };

            var res = JSON.stringify(data);
            $httpBackend.expect('POST', baseUrl + endpoint + 'user/', data, {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*'
            })
                .respond(200, res);

            accountService.login(fakeUser, fakePass).then(function (response) {
                expect(response).toEqual(data);
                done();
            }).catch(function (err) {
                done(new Error('it should resolve promise'));
            });

            $httpBackend.flush();
        })

        it('it not should execute login successfully', function () {
            var fakeUser = 'fakeUser',
                fakePass = 'fakePass',
                data = {
                    user: fakeUser,
                    pass: fakePass
                },
                res = 'Error Message';

            $httpBackend.expect('POST', baseUrl + endpoint + 'user/', data, { 'Content-Type': 'application/json', 'Accept': 'application/json, text/plain, */*' })
                .respond(404, res);
            accountService.login(fakeUser, fakePass).then(function (response) {
                expect(true).toBe(false);
            }).catch(function (err) {
                expect(err).toEqual(res);
            });

            $httpBackend.flush();
        })
    });

    describe('.createAccount', function () {
        var data;
        var email;
        var password;
        var firstName;
        var lastName;
        var newsl;
        var country;

        beforeEach(function () {
            email = "fakemail@mail.com";
            password = "fakepass";
            firstName = 'fakeFirstName';
            lastName = 'fakeLastName';
            newsl = 'fakenewsl';
            country = 'fakeCountry';

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
        })

        it('it should create account successfully', function (done) {
            var res = JSON.stringify(data);
            $httpBackend.expect('POST', baseUrl + endpoint + 'users', data, {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*'
            })
                .respond(200, res);

            accountService.createAccount(firstName, lastName, email, password, country, newsl, undefined).then(function (response) {
                expect(response).toEqual(data);
                done();
            }).catch(function (err) {
                done(new Error('Promise should not be rejected!'))
            });

            $httpBackend.flush();
        })

        it('it should not create account successfully', function (done) {
            var res = 'Error Message!';
            $httpBackend.expect('POST', baseUrl + endpoint + 'users', data, {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*'
            })
                .respond(404, res);

            accountService.createAccount(firstName, lastName, email, password, country, newsl, undefined).then(function (response) {
                done(new Error('Promise should not be resolved'));
            }).catch(function (err) {
                expect(err).toEqual(res);
                done();
            });

            $httpBackend.flush();
        })
    });

    describe('.checkin', function () {
        var location;
        var userData;

        beforeEach(function () {
            location = {};

            userData = {
                user: {
                    uid: 1234567
                },
                api_token: 123456,
                sessid: 7654321
            };
            spyOn(Auth, 'getUserData').and.returnValue(userData);
        })

        it('location longitude undefined  =>it should not update the position', function (done) {
            location.lat = 1;

            var promise = accountService.checkin(location);
            promise
                .then(
                    function () {
                        done(new Error('Promise should not be resolved'));
                    }
                ).catch(function (err) {
                    done();
                });

            $rootScope.$digest();
            $httpBackend.flush();
        })

        it('location latitute undefined  =>it should not update the position', function (done) {
            location.long = 1;

            var promise = accountService.checkin(location);
            promise
                .then(
                    function () {
                        done(new Error('Promise should not be resolved'));
                    }
                ).catch(function (err) {
                    done();
                });

            $rootScope.$digest();
            $httpBackend.flush();
        })

        it('location param undefined  =>it should not update the position', function (done) {
            location = undefined;

            var promise = accountService.checkin(location);
            promise
                .then(
                    function () {
                        done(new Error('Promise should not be resolved'));
                    }
                ).catch(function (err) {
                    done();
                });

            $rootScope.$digest();
            $httpBackend.flush();
        })

        it('location defined, correct request => it should update location', function (done) {
            location = { lat: 1, long: 2 };
            var requestData = {
                lat: location.lat,
                long: location.long,
                uid: userData.user.uid
            }

            $httpBackend.expect('POST', baseUrl + endpoint + 'user-checkin', requestData, {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'X-USER-SESSION-TOKEN': userData.sessid,
                'X-CSRF-Token': userData.api_token
            })
                .respond(200, requestData);

            accountService.checkin(location).then(function (response) {
                expect(response).toEqual(requestData);
                done();
            }).catch(function (err) {
                done(new Error('Promise should not be resolved'));
            });

            $httpBackend.flush();
        })

        it('location defined, wrong request => it should not update location', function (done) {
            location = { lat: 1, long: 2 };
            var requestData = {
                lat: location.lat,
                long: location.long,
                uid: userData.user.uid
            }

            $httpBackend.expect('POST', baseUrl + endpoint + 'user-checkin', requestData, {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'X-USER-SESSION-TOKEN': userData.sessid,
                'X-CSRF-Token': userData.api_token
            })
                .respond(404, '');

            var promise = accountService.checkin(location);
            promise
                .then(function (response) {
                    done(new Error('Promise should not be resolved'));
                }).catch(function () {
                    done();
                });

            $httpBackend.flush();
        })

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    })

    describe('hasAdditionalInfo', function () {
        var udata;

        beforeEach(function () {
            udata = {
                user: {
                    field_city: {
                        und: 'val'
                    },
                    field_birthday: {
                        und: 'val'
                    },
                    field_gender: {
                        und: 'val'
                    },
                    field_user_type: {
                        it: 'val'
                    }
                },
                pass: 'pass',
                mail: 'user',
                appname: 'appname',
                first_name: 'first_name',
                last_name: 'last_name',
                newsletter: 'newsletter',
                country: 'country',
                ID: 123456
            };
        })

        it('user is not logged in => should return undefined', function () {
            spyOn(Auth, 'getUserData').and.returnValue();
            spyOn(Auth, 'isLoggedIn').and.returnValue(false);

            expect(accountService.hasAdditionalInfo()).toBeUndefined();
        })

        it('user is logged and has all additional info => should return true', function () {
            spyOn(Auth, 'isLoggedIn').and.returnValue(true);
            spyOn(Auth, 'getUserData').and.returnValue(udata);

            expect(accountService.hasAdditionalInfo()).toBe(true);
        })

        it('user is logged and field_user_type.it undefined  => should return false', function () {
            udata.user.field_user_type.it = undefined;
            spyOn(Auth, 'isLoggedIn').and.returnValue(true);
            spyOn(Auth, 'getUserData').and.returnValue(udata);

            expect(accountService.hasAdditionalInfo()).toBe(false);
        })

        it('user is logged and field_gender.und undefined  => should return false', function () {
            udata.user.field_gender.und = undefined;
            spyOn(Auth, 'isLoggedIn').and.returnValue(true);
            spyOn(Auth, 'getUserData').and.returnValue(udata);

            expect(accountService.hasAdditionalInfo()).toBe(false);
        })

        it('user is logged and field_birthday.und undefined  => should return false', function () {
            udata.user.field_birthday.und = undefined;
            spyOn(Auth, 'isLoggedIn').and.returnValue(true);
            spyOn(Auth, 'getUserData').and.returnValue(udata);

            expect(accountService.hasAdditionalInfo()).toBe(false);
        })

        it('user is logged and field_city.und undefined  => should return false', function () {
            udata.user.field_city.und = undefined;
            spyOn(Auth, 'isLoggedIn').and.returnValue(true);
            spyOn(Auth, 'getUserData').and.returnValue(udata);

            expect(accountService.hasAdditionalInfo()).toBe(false);
        })

        it('user is logged and field_city undefined  => should return true', function () {
            udata.user.field_city = undefined;
            spyOn(Auth, 'isLoggedIn').and.returnValue(true);
            spyOn(Auth, 'getUserData').and.returnValue(udata);

            expect(accountService.hasAdditionalInfo()).toBe(true);
        })

        it('user is logged and field_user_type undefined  => should return true', function () {
            udata.user.field_user_type = undefined;

            spyOn(Auth, 'getUserData').and.returnValue(udata);
            spyOn(Auth, 'isLoggedIn').and.returnValue(true);

            expect(accountService.hasAdditionalInfo()).toBe(true);
        })

        it('user is logged and field_birthday undefined  => should return true', function () {
            udata.user.field_birthday = undefined;
            spyOn(Auth, 'isLoggedIn').and.returnValue(true);
            spyOn(Auth, 'getUserData').and.returnValue(udata);

            expect(accountService.hasAdditionalInfo()).toBe(true);
        })

        it('user is logged and field_gender undefined  => should return true', function () {
            udata.user.field_gender = undefined;
            spyOn(Auth, 'isLoggedIn').and.returnValue(true);
            spyOn(Auth, 'getUserData').and.returnValue(udata);

            expect(accountService.hasAdditionalInfo()).toBe(true);
        })

        afterEach(function () {
            $httpBackend.flush();
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    })

    describe('updateAdditionalInfo', function () {
        var udata;

        beforeEach(function () {
            udata = {
                user: {
                    uid: 123456
                },
                api_token: 123654,
                sessid: 12345

            };
        })

        it('Send correct data => it should resolve successfully', function (done) {
            var updateData = {
                field_city: 'topolinia',
                field_gender: 'male'
            };

            var expectedUpdate = angular.extend({}, udata.user, updateData);

            spyOn(Auth, 'getUserData').and.returnValue(udata);
            spyOn(Auth, 'setUserData').and.returnValue(expectedUpdate);

            $httpBackend.expect('PUT', baseUrl + endpoint + 'user/' + udata.user.uid, updateData, {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'X-USER-SESSION-TOKEN': udata.sessid,
                'X-CSRF-Token': udata.api_token
            }).respond(200, updateData);

            var promise = accountService.updateAdditionalInfo(updateData);
            promise.then(function (response) {
                done();
                expect(Auth.setUserData).toHaveBeenCalled();
            }).catch(function () {
                done(new Error('Promise should not be rejected.'))
            })

            $httpBackend.flush();
        })

        it('Send correct data => it should reject request', function (done) {
            var updateData = {
                field_city: 'topolinia',
                field_gender: 'male'
            };

            var expectedUpdate = angular.extend({}, udata.user, updateData);

            spyOn(Auth, 'getUserData').and.returnValue(udata);
            spyOn(Auth, 'setUserData').and.returnValue(expectedUpdate);

            $httpBackend.expect('PUT', baseUrl + endpoint + 'user/' + udata.user.uid, updateData, {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'X-USER-SESSION-TOKEN': udata.sessid,
                'X-CSRF-Token': udata.api_token
            }).respond(404);

            var promise = accountService.updateAdditionalInfo(updateData);
            promise.then(function (response) {
                done(new Error('Promise should be rejected.'))
            }).catch(function () {
                done();
            })

            $httpBackend.flush();
        })

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    })

    describe('resetPassword', function () {
        it('Token response OK and correct email param => it should call resetPassword successfully', function (done) {
            var data;
            var fakeemail = "email@email.com";
            var faketoken = {
                token: "token1234"
            };
            $httpBackend.expect('POST', baseUrl + endpoint + 'user/token', data, {
                // 'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*'
            }).respond(200, faketoken);

            $httpBackend.expect('POST', baseUrl + endpoint + 'user/request_new_password', {
                name: fakeemail
            }, {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/plain, */*',
                    'X-CSRF-Token': faketoken.token
                }).respond(200, "Reset Password Success!");

            var promise = accountService.resetPassword(fakeemail);

            promise.then(function (response) {
                done();
                expect(response).toEqual("Reset Password Success!");
            }).catch(function () {
                done(new Error('Promise should be resolved.'))
            })

            $httpBackend.flush();
        })

        it('Bad token response => it should reject the returned promise', function (done) {
            var data;
            var fakeemail = "email@email.com";
            $httpBackend.expect('POST', baseUrl + endpoint + 'user/token', data, {
                // 'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*'
            }).respond(404, "Request token error!");

            var promise = accountService.resetPassword(fakeemail);
            promise.then(function (response) {
                done(new Error('Promise should be rejected.'))
            }).catch(function (response) {
                done();
                expect(response).toEqual("Request token error!");
            })

            $httpBackend.flush();
        })

        it('Bad email response => it should reject the returned promise', function (done) {
            var data;
            var fakeemail = "email@email.com";
            var faketoken = {
                token: "token1234"
            };
            $httpBackend.expect('POST', baseUrl + endpoint + 'user/token', data, {
                // 'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*'
            }).respond(200, faketoken);

            $httpBackend.expect('POST', baseUrl + endpoint + 'user/request_new_password', {
                name: fakeemail
            }, {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/plain, */*',
                    'X-CSRF-Token': faketoken.token
                }).respond(404, "Reset password error!");

            var promise = accountService.resetPassword(fakeemail);
            promise.then(function (response) {
                done(new Error('Promise should be rejected.'))
            }).catch(function (response) {
                done();
                expect(response).toEqual("Reset password error!");
            })

            $httpBackend.flush();
        })

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    })

    describe('logout', function () {
        var udata;

        beforeEach(function () {
            udata = {
                user: {
                    uid: 123456
                },
                api_token: 123654,
                sessid: 12345
            };
        });

        it('it should logout successfully', function (done) {
            spyOn(Auth, 'getUserData').and.returnValue(udata);
            spyOn(Auth, 'setUserData').and.returnValue(true);

            var data;

            $httpBackend.expect('POST', baseUrl + endpoint + 'user/logout', data, {
                'Accept': 'application/json, text/plain, */*',
                'X-USER-SESSION-TOKEN': udata.sessid,
                'X-CSRF-Token': udata.api_token
            }).respond(200, "Logout Success!");

            var promise = accountService.logout();
            promise.then(function (response) {
                expect(response).toBe("Logout Success!");
                done();
            }).catch(function () {
                done(new Error('Promise should be resolved.'));
            })

            $httpBackend.flush();
        });

        it('it should not logout successfully', function (done) {
            spyOn(Auth, 'getUserData').and.returnValue(udata);
            spyOn(Auth, 'setUserData').and.returnValue(true);

            var data;

            $httpBackend.expect('POST', baseUrl + endpoint + 'user/logout', data, {
                'Accept': 'application/json, text/plain, */*',
                'X-USER-SESSION-TOKEN': udata.sessid,
                'X-CSRF-Token': udata.api_token
            }).respond(404, "Logout Error!");

            var promise = accountService.logout();
            promise.then(function (response) {
                done(new Error('Promise should be rejected.'));;
            }).catch(function (response) {
                expect(response).toBe("Logout Error!");
                done();
            })

            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('generateCard', function () {
        var udata;

        beforeEach(function () {
            udata = {
                user: {
                    uid: 123456
                },
                api_token: 123654,
                sessid: 12345
            };
        });

        it('it should generate Card successfully', function (done) {
            spyOn(Auth, 'getUserData').and.returnValue(udata);
            spyOn(Auth, 'setUserData').and.returnValue(true);

            var cardId = 12345;
            var data = {
                card_id: cardId
            };
            var expectedResponse = 'card12345';

            $httpBackend.expect('POST', baseUrl + endpoint + 'generate-new-card', data, {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'X-USER-SESSION-TOKEN': udata.sessid,
                'X-CSRF-Token': udata.api_token
            }).respond(200, expectedResponse);

            var promise = accountService.generateCard(cardId);
            promise.then(function (response) {
                udata.card = {};
                udata.card = response;
                udata.card.value = response;
                expect(response).toEqual(expectedResponse);
                expect(Auth.setUserData).toHaveBeenCalledWith(udata);
                done();
            }).catch(function (error) {
                done(new Error('Promise should be resolved.'));
            })

            $httpBackend.flush();
        });

        it('it should not generate card successfully', function (done) {
            spyOn(Auth, 'getUserData').and.returnValue(udata);
            spyOn(Auth, 'setUserData').and.returnValue(true);

            var cardId = 12345;
            var data = {
                card_id: cardId
            };
            $httpBackend.expect('POST', baseUrl + endpoint + 'generate-new-card', data, {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'X-USER-SESSION-TOKEN': udata.sessid,
                'X-CSRF-Token': udata.api_token
            }).respond(404, "Generate Card Error Response!");

            var promise = accountService.generateCard(cardId);
            promise.then(function (response) {
                done(new Error('Promise should be rejected.'));
            }).catch(function (error) {
                expect(error).toEqual("Generate Card Error Response!");
                done();
            })

            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('refreshCard', function () {
        var udata;
        beforeEach(function () {
            udata = {
                user: {
                    uid: 123456
                },
                api_token: 123654,
                sessid: 12345
            };
        });

        it('it should refresh Card successfully', function (done) {
            spyOn(Auth, 'getUserData').and.returnValue(udata);
            spyOn(Auth, 'setUserData').and.returnValue(true);

            var data = {};
            var expectedResponse = {
                card: 'card12345'
            };

            $httpBackend.expect('POST', baseUrl + endpoint + 'get-user-card', data, {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'X-USER-SESSION-TOKEN': udata.sessid,
                'X-CSRF-Token': udata.api_token
            }).respond(200, expectedResponse);

            var promise = accountService.refreshCard();
            promise.then(function (response) {
                udata.card = {};
                udata.card = {
                    value: response
                };
                expect(Auth.setUserData).toHaveBeenCalledWith(udata);
                done();
            }).catch(function (error) {
                done(new Error('Promise should be resolved.'));
            })

            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });
});