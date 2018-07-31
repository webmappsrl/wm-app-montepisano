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
    .filter('layerListFilter', function (
    ) {
        return function (input, filters) {
            if (filters === 'Eventi') {
                var compareEvents = function (a, b) {
                    var aStart = a.properties && a.properties.date_start ? a.properties.date_start : false,
                        bStart = b.properties && b.properties.date_start ? b.properties.date_start : false,
                        aStop = a.properties && a.properties.date_stop ? a.properties.date_stop : false,
                        bStop = b.properties && b.properties.date_stop ? b.properties.date_stop : false;
    
                    aStart = aStart ? [aStart.substring(6, 8), aStart.substring(4, 6), aStart.substring(0, 4)] : false;
                    aStart = aStart[0] && aStart[1] ? aStart[1] + aStart[0] : false;
                    bStart = bStart ? [bStart.substring(6, 8), bStart.substring(4, 6), bStart.substring(0, 4)] : false;
                    bStart = bStart[0] && bStart[1] ? bStart[1] + bStart[0] : false;
                    aStop = aStop ? [aStop.substring(6, 8), aStop.substring(4, 6), aStop.substring(0, 4)] : false;
                    aStop = aStop[0] && aStop[1] ? aStop[1] + aStop[0] : false;
                    bStop = bStop ? [bStop.substring(6, 8), bStop.substring(4, 6), bStop.substring(0, 4)] : false;
                    bStop = bStop[0] && bStop[1] ? bStop[1] + bStop[0] : false;
    
                    if (aStop && bStop) {
                        return aStop > bStop ? 1 : -1;
                    }
                    else if (aStop) {
                        return -1;
                    }
                    else if (bStop) {
                        return 1;
                    }
                    else if (aStart && bStart) {
                        return aStart > bStart ? 1 : -1;
                    }
                    else if (aStart) {
                        return -1;
                    }
                    else if (bStart) {
                        return 1;
                    }
                    else {
                        return -1;
                    }
                },
                result = [];
    
                var date = new Date();
    
                for (var i in input) {
                    var stopDate = input[i].properties && input[i].properties.date_stop ? input[i].properties.date_stop : false;
                    stopDate = stopDate ? [stopDate.substring(6, 8), stopDate.substring(4, 6), stopDate.substring(0, 4)] : false;
                    if (stopDate) {
                        if (date.getFullYear() % 100 < +stopDate[2] % 100 || (
                            date.getYear() % 100 === +stopDate[2] % 100 && (
                                    date.getMonth() + 1 < +stopDate[1]
                                ) || (
                                    date.getMonth() + 1 === +stopDate[1] &&
                                    date.getDate() <= +stopDate[0]
                                )
                            )
                        ) {
                            result.push(input[i]);
                        }
                    }
                    else {
                        result.push(input[i]);
                    }
                }
    
                return result.sort(compareEvents);
            }
            // else {
            //     var compareTitles = function (a, b) {
            //         return a.properties.name > b.properties.name;
            //     },
            //         result = input;
                
            //     if (result) {
            //         return result.sort(compareTitles);
            //     }
            //     else {
            //         return input;
            //     }
            // }
            return input;
        };
    });