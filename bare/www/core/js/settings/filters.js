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
        $translate,
        CONFIG
    ) {
        return function (input, search) {
            var results = [],
                pattern = new RegExp(search.toLowerCase()),
                currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it",
                defaultLang = (CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual) ? CONFIG.LANGUAGES.actual.substring(0, 2) : 'it';

            if (search === "") {
                return input;
            }

            for (var id in input) {
                if (pattern.test(input[id].title.rendered.toLowerCase()) ||
                    pattern.test(input[id].n7webmapp_route_cod.toLowerCase()) || (
                        input[id].packageTitle[currentLang] &&
                        pattern.test(input[id].packageTitle[currentLang].toLowerCase()) ||
                        input[id].packageTitle[defaultLang] &&
                        pattern.test(input[id].packageTitle[defaultLang].toLowerCase()) ||
                        input[id].packageTitle[Object.keys(input[id].packageTitle)[0]] &&
                        pattern.test(input[id].packageTitle[Object.keys(input[id].packageTitle)[0]].toLowerCase())
                    )) {
                    results.push(input[id]);
                }
            }
            return results;
        };
    });

angular.module('webmapp')
    .filter('orderPackagesFilter', function (
        Utils
    ) {
        return function (input, search) {
            if (!search) {
                return input;
            }
            else {
                var array = [];

                for (var i in input) {
                    array.push(input[i]);
                }

                array.sort(function (a, b) {
                    if (!a.startPoi) {
                        return 1;
                    }
                    else if (!b.startPoi) {
                        return -1;
                    }
                    else {
                        var distA = Utils.distanceInMeters(search.lat, search.long, a.startPoi.lat, a.startPoi.long),
                            distB = Utils.distanceInMeters(search.lat, search.long, b.startPoi.lat, b.startPoi.long);

                        return distA >= distB ? 1 : -1;
                    }
                });

                return array;
            }
        };
    });
