/*global angular*/

angular.module('webmapp')

    .factory('ConfigurationService', function ConfigurationService(
        CONFIG,
        Utils
    ) {
        var configurationService = {};

        configurationService.isGeolocationAvailable = function () {
            return (!Utils.isBrowser() &&
                CONFIG.GEOLOCATION && CONFIG.GEOLOCATION.enable)
                || (Utils.isBrowser() &&
                    CONFIG.GEOLOCATION && CONFIG.GEOLOCATION.enable && CONFIG.GEOLOCATION.enableOverHttps);
        };

        configurationService.isNavigationAvailable = function () {
            return configurationService.isGeolocationAvailable()
                && (!Utils.isBrowser() && CONFIG.GEOLOCATION && CONFIG.GEOLOCATION.navigation && CONFIG.GEOLOCATION.navigation.enable);
        };

        configurationService.isRecordAvailable = function () {
            return configurationService.isGeolocationAvailable()
                && (!Utils.isBrowser() && CONFIG.GEOLOCATION && CONFIG.GEOLOCATION.record && CONFIG.GEOLOCATION.record.enable);
        };

        configurationService.isRemoteTrackAvailable = function () {
            return configurationService.isGeolocationAvailable()
                && (!Utils.isBrowser() && CONFIG.GEOLOCATION && CONFIG.GEOLOCATION.remoteTrack && CONFIG.GEOLOCATION.remoteTrack.enable);
        };

        configurationService.getTrackBoundsDistance = function () {
            return CONFIG.GEOLOCATION && CONFIG.GEOLOCATION.NAVIGATION && CONFIG.GEOLOCATION.NAVIGATION.trackBoundsDistance ? CONFIG.GEOLOCATION.NAVIGATION.trackBoundsDistance : 200;
        };

        configurationService.getStyle = function () {
            return CONFIG.STYLE;
        };

        configurationService.getTitle = function () {
            return CONFIG.OPTIONS.title;
        };

        configurationService.getDefaultLang = function () {
            return (CONFIG.LANGUAGES && CONFIG.LANGUAGES.actual) ? CONFIG.LANGUAGES.actual.substring(0, 2) : 'it';
        };

        return configurationService;
    });
