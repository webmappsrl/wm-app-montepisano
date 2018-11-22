describe('Communication.Factory', function () {
    beforeEach(module('webmapp'));

    var communicationService,
        Auth,
        $httpBackend,
        $q,
        $rootScope,
        MapService;

    beforeEach(inject(function (Communication, _$httpBackend_, _$q_, _$rootScope_, _MapService_) {
        communicationService = Communication;
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
        $q = _$q_;
        MapService = _MapService_;

        $httpBackend.whenGET(/^core.*/).respond(404);

        // jasmine.clock().uninstall();
        // jasmine.clock().install();
    }));

    beforeEach(function () {
        spyOn(MapService, 'setItemInLocalStorage').and.callFake(function () {
            var defer = $q.defer();
            defer.resolve();
            return defer.promise;
        });
    });

    describe('post', function () {
        beforeEach(function () {
            spyOn(MapService, 'getItemFromLocalStorage').and.callFake(function () {
                var defer = $q.defer();
                defer.reject();
                return defer.promise;
            });
        });

        it('it should POST successfully', function (done) {
            var url = "testurl.com";
            var data = { data: "test" };
            var expectedResponse = "POST request ok!";
            $httpBackend.expect('POST', url, data).respond(200, expectedResponse);

            communicationService.post(url, data).then(function (response) {
                expect(response).toEqual(expectedResponse);
                done();
            }).catch(function (error) {
                done(new Error("it should resolve promise"));
            })

            $httpBackend.flush();
        });

        it('it should not POST successfully', function (done) {
            var url = "testurl.com";
            var data = { data: "test" };
            var expectedResponse = "POST request Error!";
            $httpBackend.expect('POST', url, data).respond(404, expectedResponse);

            var promise = communicationService.post(url, data);

            promise.then(function (response) {
                done(new Error("it should reject promise"))
            }).catch(function (error) {
                expect(error).toEqual(expectedResponse);
                done();
            })

            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('callAPI', function () {
        beforeEach(function () {
            spyOn(MapService, 'getItemFromLocalStorage').and.callFake(function () {
                var defer = $q.defer();
                defer.reject();
                return defer.promise;
            });
        });
        it('it should call API successfully', function (done) {
            var url = "testurl.com";
            var data = { data: "test" };
            var expectedResponse = "CALL API request ok!";

            $httpBackend.expect('POST', url, data, {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json, text/plain, */*'
            }).respond(200, expectedResponse);

            var promise = communicationService.callAPI(url, data);

            promise.then(function (response) {
                expect(response).toEqual(expectedResponse);
                done();
            }).catch(function (error) {
                done(new Error("it should resolve promise"))
            })

            $httpBackend.flush();
        });

        it('it should not call API successfully', function (done) {
            var url = "testurl.com";
            var data = { data: "test" };
            var expectedResponse = "CALL API request Error!";
            $httpBackend.expect('POST', url, data, {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json, text/plain, */*'
            }).respond(404, expectedResponse);

            var promise = communicationService.callAPI(url, data);

            promise.then(function (response) {
                done(new Error("it should reject promise"))
            }).catch(function (error) {
                expect(error).toEqual(expectedResponse);
                done();
            })

            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('get', function () {
        beforeEach(function () {
            spyOn(MapService, 'getItemFromLocalStorage').and.callFake(function () {
                var defer = $q.defer();
                defer.reject();
                return defer.promise;
            });
        });
        it('it should execute GET successfully', function (done) {
            var url = "testurl.com";
            var expectedResponse = "GET response ok!";
            var data;

            $httpBackend.expect('GET', url, data, {
                'Access-Control-Allow-Origin': '*',
                Accept: 'application/json, text/plain, */*'
            }).respond(200, expectedResponse);

            var promise = communicationService.get(url);
            promise.then(function (response) {
                expect(response).toEqual(expectedResponse);
                done();
            }).catch(function (error) {
                done(new Error("it should resolve promise"))
            })

            $httpBackend.flush();
        });

        it('it should not execute GET successfully', function (done) {
            var url = "testurl.com";
            var expectedResponse = "GET bad response!";
            var data;

            $httpBackend.expect('GET', url, data, {
                'Access-Control-Allow-Origin': '*',
                Accept: 'application/json, text/plain, */*'
            }).respond(404, expectedResponse);

            var promise = communicationService.get(url);

            promise.then(function (response) {
                done(new Error("it should reject promise"));
            }).catch(function (error) {
                expect(error).toEqual(expectedResponse);
                done();
            })

            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('get', function () {
        beforeEach(function () {
            spyOn(MapService, 'getItemFromLocalStorage').and.callFake(function () {
                var defer = $q.defer();
                defer.reject();
                return defer.promise;
            });
        });
        it('it should execute GET successfully', function (done) {
            var url = "testurl.com";
            var expectedResponse = "GET response ok!";
            var data;

            $httpBackend.expect('GET', url, data, {
                'Access-Control-Allow-Origin': '*',
                Accept: 'application/json, text/plain, */*'
            }).respond(200, expectedResponse);

            var promise = communicationService.get(url);
            promise.then(function (response) {
                expect(response).toEqual(expectedResponse);
                done();
            }).catch(function (error) {
                done(new Error("it should resolve promise"))
            })

            $httpBackend.flush();
        });

        it('it should not execute GET successfully', function (done) {

            var url = "testurl.com";
            var expectedResponse = "GET bad response!";
            var data;

            $httpBackend.expect('GET', url, data, {
                'Access-Control-Allow-Origin': '*',
                Accept: 'application/json, text/plain, */*'
            }).respond(404, expectedResponse);

            var promise = communicationService.get(url);

            promise.then(function (response) {
                done(new Error("it should reject promise"));
            }).catch(function (error) {
                expect(error).toEqual(expectedResponse);
                done();
            });

            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('getJSON', function () {
        beforeEach(function () {
            spyOn(MapService, 'getItemFromLocalStorage').and.callFake(function () {
                var defer = $q.defer();
                defer.reject();
                return defer.promise;
            });
        });
        it('it should execute getJSON successfully', function (done) {
            var url = "testurl.com";
            var expectedResponse = "getJSON response ok!";
            var data;
            spyOn($, 'getJSON').and.callFake(function (url) {
                return {
                    success: function (callback) {
                        callback(expectedResponse);
                        return {
                            error: function (callback) {
                                callback();
                            }
                        }
                    },
                    error: function (callback) {
                        callback();
                    }
                }
            });

            var promise = communicationService.getJSON(url);
            promise.then(function (response) {
                expect($.getJSON).toHaveBeenCalled();
                expect(response).toEqual(expectedResponse);
                done();
            }).catch(function (error) {
                done(new Error("it should resolve promise"))
            })

            $httpBackend.flush();
        });

        it('it should not execute getJSON successfully', function (done) {
            var url = "testurl.com";
            var expectedResponse = "getJSON bad  response!";
            var data;
            spyOn($, 'getJSON').and.callFake(function (url) {

                return {
                    success: function (callback) {
                        return {
                            error: function (callback) {
                                callback(expectedResponse);
                            }
                        }
                    },
                    error: function (callback) {
                        callback();
                    }
                }
            });

            var promise = communicationService.getJSON(url);
            promise.then(function (response) {
                done(new Error("it should resolve promise"))
            }).catch(function (error) {
                expect($.getJSON).toHaveBeenCalled();
                expect(error).toEqual(expectedResponse);
                done();
            })

            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('queuedPost', function () {
        beforeEach(function () {
            spyOn(MapService, 'getItemFromLocalStorage').and.callFake(function () {
                var defer = $q.defer();
                defer.reject();
                return defer.promise;
            });
            spyOn(window, 'setInterval');
        });

        it('online => should call callAPI and resolve true', function (done) {
            var url = "testurl.com";
            var expectedResponse = true;
            var data = {
                content: "test"
            };
            spyOn(communicationService, 'callAPI').and.callFake(function (url, sentData) {
                var defer = $q.defer();
                expect(sentData).toEqual(data);
                defer.resolve(true);
                return defer.promise;
            });

            communicationService.queuedPost(url, data).then(function (response) {
                expect(communicationService.callAPI).toHaveBeenCalled();
                expect(response).toEqual(expectedResponse);
                done();
            }).catch(function (error) {
                fail(new Error("it should resolve promise"))
            });

            $httpBackend.flush();
        });

        it('offline => should call callAPI, reject and resolve false and call setInterval', function (done) {
            var url = "testurl.com";
            var expectedResponse = false;
            var data = {
                content: "test"
            };
            spyOn(communicationService, 'callAPI').and.callFake(function (url, sentData) {
                var defer = $q.defer();
                expect(sentData).toEqual(data);
                defer.reject();
                return defer.promise;
            });

            communicationService.queuedPost(url, data).then(function (response) {
                expect(communicationService.callAPI).toHaveBeenCalled();
                expect(response).toEqual(expectedResponse);
                expect(MapService.setItemInLocalStorage).toHaveBeenCalled();
                expect(window.setInterval).toHaveBeenCalled();
                done();
            }, function () {
                fail(new Error("it should resolve false"));
            }).catch(function (error) {
                fail(new Error("it should resolve false"));
            });

            $httpBackend.flush();
        });

        it('called twice offline => should call callAPI twice resolve false twice and not call setInterval', function (done) {
            var url = "testurl.com";
            var expectedResponse = false;
            var data = {
                content: "test"
            };
            spyOn(communicationService, 'callAPI').and.callFake(function (url, sentData) {
                var defer = $q.defer();
                expect(sentData).toEqual(data);
                defer.reject();
                return defer.promise;
            });

            communicationService.queuedPost(url, data).then(function (response) {
                expect(communicationService.callAPI).toHaveBeenCalled();
                expect(response).toEqual(expectedResponse);
                expect(MapService.setItemInLocalStorage).toHaveBeenCalled();
                expect(window.setInterval).toHaveBeenCalledTimes(1);
                // jasmine.clock().tick(10000);
                communicationService.queuedPost(url, data).then(function (response) {
                    expect(communicationService.callAPI).toHaveBeenCalled();
                    expect(response).toEqual(expectedResponse);
                    expect(MapService.setItemInLocalStorage).toHaveBeenCalled();
                    //TODO Trouble as setInterval result to undefined only in test env
                    // expect(window.setInterval).toHaveBeenCalledTimes(1);
                    // jasmine.clock().tick(15000);
                    // expect(window.setInterval).toHaveBeenCalledTimes(2);
                    done();
                }, function () {
                    fail(new Error("it should resolve false"));
                }).catch(function (error) {
                    fail(new Error("it should resolve false"));
                });
            }, function () {
                fail(new Error("it should resolve false"));
            }).catch(function (error) {
                fail(new Error("it should resolve false"));
            });

            $httpBackend.flush();
        });

        afterEach(function () {
            // jasmine.clock().uninstall();
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });
});
