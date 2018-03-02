/*global angular*/

angular.module('webmapp')

    .factory('Utils', function Utils(
        $q,
        $state,
        $timeout,
        $location,
        $rootScope,
        $ionicModal,
        $ionicPopup,
        $translate
    ) {
        var utils = {},
            modals = {};

        utils.createModal = function (path, options, scope) {
            var defer = $q.defer();

            var modalScope = scope || $rootScope.$new(),
                modalOptions = options || {};

            angular.extend(modalOptions, {
                scope: modalScope,
                animation: 'slide-in-up'
            });

            $ionicModal.fromTemplateUrl(path, modalOptions)
                .then(function (modalObj) {
                    modals[path] = modalObj;
                    defer.resolve(modalObj);
                });

            modalScope.hide = function () {
                modals[path].hide();
            };

            return defer.promise;
        };

        utils.closeAllModals = function () {
            for (var i in modals) {
                modals[i].hide();
            }
        };

        utils.forceDigest = function () {
            $rootScope.$$phase || $rootScope.$apply();
        };

        utils.goTo = function (path) {
            var numberOfSlash = path.match(/\//g) || [];

            var splitted, state, param, parentId;

            if (path === '/') {
                $state.go('app.main.map');
            } else if (path.indexOf('/') === -1) {
                $state.go('app.main.' + path);
            } else if (numberOfSlash.length === 2) {
                splitted = path.split('/');
                state = splitted[0];
                parentId = splitted[1];
                param = splitted[2];

                $state.go('app.main.detail' + state, {
                    parentId: parentId,
                    id: param
                });
            } else {
                splitted = path.split('/');
                state = splitted[0];
                param = splitted[1];

                $state.go('app.main.' + state, {
                    id: param
                });
            }

            // $location.path(path);
        };

        utils.goBack = function () {
            if ($rootScope.backAllowed) {
                history.back();
            } else {
                // TODO: retrive the relative state based on the startUrl on the configuration
                utils.goTo('map/');
            }
        };

        utils.isBrowser = function () {
            return typeof window.cordova === 'undefined';
        };

        utils.slowAdd = function (itemsCache, destArray, firstTime) {
            var updateHitsTimer;

            var slowAdd = function (itemsCache, destArray, firstTime) {
                $timeout.cancel(updateHitsTimer);

                if (itemsCache.length === 0) {
                    return;
                }

                var currentHits = 0,
                    maxHits = 80,
                    delay = 120;

                var doAdd = function () {
                    while (currentHits < maxHits && itemsCache.length !== 0) {
                        var currentItem = itemsCache.shift();
                        destArray.push(currentItem);
                        currentHits++;
                    }

                    slowAdd(itemsCache, destArray);
                };

                if (firstTime) {
                    doAdd();
                } else {
                    updateHitsTimer = $timeout(function () {
                        doAdd();
                    }, delay);
                }
            };

            slowAdd(itemsCache, destArray, firstTime);
        };

        utils.generateUID = function (separator) {
            separator = separator || '-';

            function S4() {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            }

            return (S4() + S4() + separator + S4() + separator + S4() + separator + S4() + separator + S4() + S4() + S4());
        };

        utils.openInExternalBrowser = function (url) {
            if (utils.isBrowser()) {
                window.open(url, '_blank');
            } else {
                // Open in external browser
                window.open(url, '_system', 'location=yes');
            }

        };

        utils.openInAppBrowser = function (url) {
            // Open in app browser
            if (navigator.onLine) {
                window.open(url, '_blank');
            } else {
                $ionicPopup.alert({
                    title: $translate.instant("Attenzione"),
                    template: $translate.instant("Pagina disponibile solo online. Controlla la connessione e riprova"),
                    buttons: [{
                        text: 'Ok',
                        type: 'button-positive'
                    }]
                });
            }
        };

        utils.openCordovaWebView = function (url) {
            // Open cordova webview if the url is in the whitelist otherwise opens in app browser
            window.open(url, '_self');
        };

        utils.convertUTCDateToLocalDate = function (date) {
            var newDate = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);

            var offset = date.getTimezoneOffset() / 60;
            var hours = date.getHours();

            newDate.setHours(hours - offset);

            return newDate;
        };

        utils.isInTime = function (startDateString, endDateString) {
            var currentTime = utils.convertUTCDateToLocalDate(new Date());

            var startDate = new Date(startDateString),
                endDate = new Date(endDateString);

            return currentTime.getTime() > startDate.getTime() && currentTime.getTime() < endDate.getTime();
        };

        utils.trimHtml = function (html, options) {

            options = options || {};

            var limit = options.limit || 100,
                preserveTags = (typeof options.preserveTags !== 'undefined') ? options.preserveTags : true,
                wordBreak = (typeof options.wordBreak !== 'undefined') ? options.wordBreak : false,
                suffix = options.suffix || '...',
                moreLink = options.moreLink || '',
                moreText = options.moreText || '»';

            var arr = html.replace(/</g, '\n<')
                .replace(/>/g, '>\n')
                .replace(/\n\n/g, '\n')
                .replace(/^\n/g, '')
                .replace(/\n$/g, '')
                .split('\n');

            var sum = 0,
                row, cut, add,
                tagMatch,
                tagName,
                rowCut,
                tagStack = [],
                more = false;

            for (var i = 0; i < arr.length; i++) {

                row = arr[i];
                // count multiple spaces as one character
                rowCut = row.replace(/[ ]+/g, ' ');

                if (!row.length) {
                    continue;
                }

                if (row[0] !== '<') {

                    if (sum >= limit) {
                        row = '';
                    } else if ((sum + rowCut.length) >= limit) {

                        cut = limit - sum;

                        if (row[cut - 1] === ' ') {
                            while (cut) {
                                cut -= 1;
                                if (row[cut - 1] !== ' ') {
                                    break;
                                }
                            }
                        } else {

                            add = row.substring(cut).split('').indexOf(' ');

                            // break on halh of word
                            if (!wordBreak) {
                                if (add !== -1) {
                                    cut += add;
                                } else {
                                    cut = row.length;
                                }
                            }
                        }

                        row = row.substring(0, cut) + suffix;

                        if (moreLink) {
                            row += '<a href="' + moreLink + '" style="display:inline">' + moreText + '</a>';
                        }

                        sum = limit;
                        more = true;
                    } else {
                        sum += rowCut.length;
                    }
                } else if (!preserveTags) {
                    row = '';
                } else if (sum >= limit) {

                    tagMatch = row.match(/[a-zA-Z]+/);
                    tagName = tagMatch ? tagMatch[0] : '';

                    if (tagName) {
                        if (row.substring(0, 2) !== '</') {

                            tagStack.push(tagName);
                            row = '';
                        } else {

                            while (tagStack[tagStack.length - 1] !== tagName && tagStack.length) {
                                tagStack.pop();
                            }

                            if (tagStack.length) {
                                row = '';
                            }

                            tagStack.pop();
                        }
                    } else {
                        row = '';
                    }
                }

                arr[i] = row;
            }

            return {
                html: arr.join('\n').replace(/\n/g, ''),
                more: more
            };
        };

        return utils;
    });