/*global angular*/

angular.module('webmapp')

    .factory('Communication', function Communication(
        $http,
        $ionicPlatform,
        $q,
        $rootScope,
        MapService
    ) {
        var communication = {};

        var registeredEvents = [];

        var queueToSend = [],
            queueInterval = null,
            intervalDelay = 20000,
            queueLoaded = false;

        var sendReport = function (url, data, index) {
            var currentRequest = communication.callAPI(url, data);

            currentRequest.then(function () {
                queueToSend.splice(index, 1)
                try {
                    MapService.setItemInLocalStorage("$wm_queueToSend", JSON.stringify(queueToSend))
                }
                catch (e) { }

                if (queueToSend.length <= 0) {
                    try {
                        clearInterval(queueInterval)
                    }
                    catch (e) { }

                    queueInterval = null;
                }
            }, function (error) {
                console.log(error)
            });
        };

        var queueIntervalFunction = function () {
            for (var index in queueToSend) {
                sendReport(queueToSend[index].url, queueToSend[index].data, index);
            }
        };

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
            }).success(function (data) {
                defer.resolve(data);
            }).error(function (error) {
                defer.reject(error);
            });

            return defer.promise;
        };

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

        communication.queuedPost = function (url, data) {
            var defer = $q.defer(),
                currentRequest = communication.callAPI(url, data);

            currentRequest.then(function () {
                defer.resolve(true);
            }, function (error) {
                queueToSend.push({
                    url: url,
                    data: data
                });

                try {
                    MapService.setItemInLocalStorage("$wm_queueToSend", JSON.stringify(queueToSend));
                }
                catch (e) { }

                if (!queueInterval) {
                    queueInterval = setInterval(queueIntervalFunction, intervalDelay);
                }

                defer.resolve(false);
            });


            return defer.promise;
        };

        communication.getPostQueueLength = function (url) {
            var defer = $q.defer()
            if (queueLoaded) {
                if (url) {
                    var count = 0;
                    for (var i in queueToSend) {
                        if (queueToSend[i].url === url) {
                            count++;
                        }
                    }

                    defer.resolve(count);
                }
                else {
                    defer.resolve(queueToSend.length);
                }
            }
            else {
                setTimeout(function () {
                    communication.getPostQueueLength(url).then(function (length) {
                        defer.resolve(length)
                    }, function (err) {
                        defer.resolve(0)
                    });
                }, 50);
            }
            return defer.promise;
        };

        registeredEvents.push(
            $rootScope.$on('$destroy', function () {
                MapService.setItemInLocalStorage("$wm_queueToSend", JSON.stringify(queueToSend)).then(function () {
                }, function () {

                });
                for (var i in registeredEvents) {
                    registeredEvents[i]();
                }
                delete registeredEvents;
            })
        );

        $ionicPlatform.ready(function () {
            MapService.getItemFromLocalStorage("$wm_queueToSend").then(function (data) {
                var queue = JSON.parse(data.data);
                if (queue && queue.length > 0) {
                    queueToSend = queue;
                    queueInterval = setInterval(queueIntervalFunction, intervalDelay);
                }
                queueLoaded = true;
            }, function (err) {
                queueLoaded = true;
            });
        });

        return communication;
    });
