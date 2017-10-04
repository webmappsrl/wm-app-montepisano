angular.module('webmapp')

.factory('Languages', function Languages(
    $q,
    $timeout,
    CONFIG
) {

    var lang = {};
    
    lang = function (options) {
        var deferred = $q.defer(),
        translations;

        if (options.key === 'it_IT') {
            translations = {
                'it_IT' : 'ITALIANO',
                'en_EN' : 'INGLESE'
            };
        } else {
            translations = {
                'it_IT' : 'ITALIAN',
                'en_EN' : 'ENGLISH'
            };
        }

        $timeout(function () {
            deferred.resolve(translations);
        }, 2000);

        return deferred.promise;
    };

    return lang;

});