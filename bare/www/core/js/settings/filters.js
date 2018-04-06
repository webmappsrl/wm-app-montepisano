angular.module('webmapp')
    .filter('orderObjectByName', function () {
        return function (input) {
            var results = [],
                order = 'asc';

            if (!angular.isObject(input)) {
                return input;
            }

            for (var key in input) {
                results.push(input[key]);
            }
            results.sort(function (a, b) {
                // parseInt for textual attribute
                a = a.properties.name.trim().substr(0, 1);
                b = b.properties.name.trim().substr(0, 1);

                return order === 'asc' ? a > b : b < a;
            });

            return results;
        };
    });

angular.module('webmapp')
    .filter('categoryFilter', function (
        $translate
    ) {
        return function (input, filters) {
            var results = [],
                order = 'asc',
                applyFilter = false;

            for (var k in filters) {
                if (k !== $translate.instant("Tutte") && !filters[k].value) {
                    applyFilter = true;
                    break;
                }
            }

            if (!applyFilter) {
                return input;
            }

            for (var package in input) {
                for (var key in input[package].activity) {
                    if (filters[input[package].activity[key]] &&
                        filters[input[package].activity[key]].value) {
                        results.push(input[package]);
                        break;
                    }
                }
            }

            return results;
        };
    });

angular.module('webmapp')
    .filter('packagesSearchFilter', function (
    ) {
        return function (input, search) {
            var results = [],
                pattern = new RegExp(search.toLowerCase());

            if (search === "") {
                return input;
            }

            for (var id in input) {
                if (pattern.test(input[id].title.rendered.toLowerCase()) ||
                    pattern.test(input[id].n7webmapp_route_cod.toLowerCase()) ||
                    pattern.test(input[id].packageTitle.toLowerCase())) {
                    results.push(input[id]);
                }
            }
            return results;
        };
    });