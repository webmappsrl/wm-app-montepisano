angular.module('webmapp')

.filter('orderObjectByName', function() {
    return function(input) {
        var results = [],
            order = 'asc';

        if (!angular.isObject(input)) {
            return input;
        }

        for (var key in input) {
            results.push(input[key]);
        }
        results.sort(function(a, b) {
            // parseInt for textual attribute
            a = a.properties.name.trim().substr(0, 1);
            b = b.properties.name.trim().substr(0, 1);

            return order === 'asc' ? a > b : b < a;
        });

        return results;
    };
});

angular.module('webmapp')

.filter('categoryFilter', function() {
    return function(input, filter) {
        var results = [],
            order = 'asc';

        for (var package in input) {
            for (var key in input[package].webmapp_category) {
                if (filter[input[package].webmapp_category[key]]) {
                    results.push(input[package]);
                    break;
                }
            }
        };

        return results;
    };
});