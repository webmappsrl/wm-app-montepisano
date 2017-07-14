/*global angular*/

angular.module('webmapp')

.factory('Communication', function Communication(
    $http, 
    $q
) {
    var communication = {};

    communication.getJSON = function(url) {
        var defer = $q.defer(),
            options = {
                method: 'GET',
                url: url,
                // dataType: 'json',
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
                }
            };

        $http(options)
            .success(function(data) {
                defer.resolve(data);
            })
            .error(function(error) {
                defer.reject(error);
            });

        return defer.promise;
    };

    communication.getLocalFile = function(url) {
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

            fileEntry.file(function(file) {
                var reader = new FileReader();

                reader.onloadend = function(e) {
                    defer.resolve(this.result);
                }

                reader.readAsText(file);
            });

        }

        return defer.promise;
    };

    return communication;
});