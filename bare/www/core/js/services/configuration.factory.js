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

        configurationService.isExportTrackAvailable = function () {
            return configurationService.isRecordAvailable()
                && CONFIG.GEOLOCATION.record.enableExport;
        };

        configurationService.isRemoteTrackAvailable = function () {
            return configurationService.isGeolocationAvailable()
                && (!Utils.isBrowser() && CONFIG.GEOLOCATION && CONFIG.GEOLOCATION.remoteTrack && CONFIG.GEOLOCATION.remoteTrack.enable);
        };

        configurationService.getTrackBoundsDistance = function () {
            return CONFIG.GEOLOCATION && CONFIG.GEOLOCATION.NAVIGATION && CONFIG.GEOLOCATION.NAVIGATION.trackBoundsDistance ? CONFIG.GEOLOCATION.NAVIGATION.trackBoundsDistance : 200;
        };

        configurationService.getDefaultSpeedType = function () {
            return configurationService.isGeolocationAvailable() && CONFIG.GEOLOCATION.defaultSpeedType ? CONFIG.GEOLOCATION.defaultSpeedType : 'average';
        };

        configurationService.getRemoteTrackUrl = function () {
            return configurationService.isRemoteTrackAvailable() && CONFIG.GEOLOCATION.remoteTrack.apiUrl ? CONFIG.GEOLOCATION.remoteTrack.apiUrl : 'https://api.webmapp.it/services/share.php';
        };

        configurationService.getPositionsClusterSize = function () {
            return configurationService.isRemoteTrackAvailable() && CONFIG.GEOLOCATION.remoteTrack.minPositionsToSend ? CONFIG.GEOLOCATION.remoteTrack.minPositionsToSend : 1;
        };

        configurationService.getPositionsDistanceInterval = function () {
            return configurationService.isRemoteTrackAvailable() && CONFIG.GEOLOCATION.remoteTrack.minDistanceBetweenPosition ? CONFIG.GEOLOCATION.remoteTrack.minDistanceBetweenPosition : 6;
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
