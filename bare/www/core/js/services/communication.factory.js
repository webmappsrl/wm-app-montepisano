/*global angular*/

angular.module('webmapp')

    .factory('Communication', function Communication(
        $http,
        $q
    ) {
        var communication = {};

        communication.post = function (url, data) {
            var defer = $q.defer(),
                options = {
                    method: 'POST',
                    url: url,
                    data: data,
                    dataType: 'json'
                };

            $http(options)
                .success(function (data) {
                    defer.resolve(data);
                })
                .error(function (error) {
                    defer.reject(error);
                });

            return defer.promise;
        };

        communication.callAPI = function (url, data) {
            var defer = $q.defer();

            $http({
                    method: 'POST',
                    url: url,
                    dataType: 'json',
                    crossDomain: true,
                    data: data,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
                .success(function (data) {
                    defer.resolve(data);
                })
                .error(function (error) {
                    defer.reject(error);
                });

            return defer.promise;
        }

        communication.get = function (url) {
            var defer = $q.defer();

            $http.get(url, {
                    responseType: 'blob',
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    }
                }).success(function (data) {
                    defer.resolve(data);
                })
                .error(function (error) {
                    defer.reject(error);
                });

            return defer.promise;
        }

        communication.getJSON = function (url) {
            var defer = $q.defer();

            $.getJSON(url)
                .success(function (data) {
                    defer.resolve(data);
                })
                .error(function (error) {
                    defer.reject(error);
                });

            return defer.promise;
        };

        communication.getLocalFile = function (url) {
            var defer = $q.defer();

            window.resolveLocalFileSystemURL(url, gotFile, fail);

            function fail(e) {
                defer.reject(e);
            }

            function gotFile(fileEntry) {

                if (typeof fileEntry.file !== 'function') {
                    defer.reject();
                    return;
                }

                fileEntry.file(function (file) {
                    var reader = new FileReader();

                    reader.onloadend = function (e) {
                        defer.resolve(this.result);
                    }

                    reader.readAsText(file);
                });

            }

            return defer.promise;
        };

        return communication;
    });