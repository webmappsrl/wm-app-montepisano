describe('Communication.Factory', function () {
    var communicationService;
    var Auth;
    var $httpBackend;
    var $q;
    var $rootScope;

    beforeEach(module('webmapp'));

    beforeEach(inject(function (Communication, _$httpBackend_, _$q_, _$rootScope_) {
        communicationService = Communication;
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
        $q = _$q_;

        $httpBackend.whenGET(/^core.*/).respond(404);
    }));

    describe('post', function () {
        it('it should POST successfully', function (done) {
            var url = "testurl.com";
            var data = { data: "test" };
            var expectedResponse = "POST request ok!";
            $httpBackend.expect('POST', url, data).respond(200, expectedResponse);

            var promise = communicationService.post(url, data);

            promise.then(function (response) {
                expect(response).toEqual(expectedResponse);
                done();
            }).catch(function (error) {
                done(new Error("it should resolve promise"))
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
                fail("it should reject promise")
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
            });

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

    describe('get', function () {
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
            });

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

            communicationService.getJSON(url).then(function (response) {
                expect($.getJSON).toHaveBeenCalled();
                expect(response).toEqual(expectedResponse);
                done();
            }).catch(function (error) {
                done(new Error("it should resolve promise"))
            });

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
            });

            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('getLocalFile', function () {
        it('should reject as resolveLocalFileSystemURL fail', function (done) {
            var error = 'FILE NOT FOUND';
            window.resolveLocalFileSystemURL = function (url, file, failFunction) {
                failFunction(error);
            };

            communicationService.getLocalFile('ciao').then(function () {
                fail('it should not resolve');
            }, function (err) {
                expect(err).toEqual(error);
                done();
            });

            $httpBackend.flush();
        });

        it('should reject as resolveLocalFileSystemURL resolve invalid file', function (done) {
            var result = 'INVALID FILE';
            window.resolveLocalFileSystemURL = function (url, file, failFunction) {
                file(result);
            };

            communicationService.getLocalFile('ciao').then(function () {
                fail('it should not resolve');
            }, function (err) {
                expect(err).toEqual(false);
                done();
            });

            $httpBackend.flush();
        });

        it('should resolve correctly for existing file', function () {
            var fileEntry = {
                file: function (fun) {
                    fun(new Blob(['test content']));
                }
            };
            window.resolveLocalFileSystemURL = function (url, fileFunction, failFunction) {
                fileFunction(fileEntry);
            };

            communicationService.getLocalFile('ciao').then(function (result) {
                expect(result).toEqual('test content');
            }, function (err) {
                fail('it should not resolve');
            });

            $httpBackend.flush();
        });
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });
});
