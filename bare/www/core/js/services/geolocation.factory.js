angular.module('webmapp')

.factory('GeolocationService', function GeolocationService(
) {
    // Contains all the exposed functions
    var geolocationService = {};

    /**
     * status goes from:
     * {false, false, false} > {true, true, false}   - geolocation enabled and follow activated
     * {true, -, -}          > {true, false, false}  - at drag/zoom
     * {true, true, false}   > {true, true, true}    - geolocation button clicked
     * {true, true, true}    > {true, false, false}  - geolocation button clicked
     * {true, -, -}          > {false, false, false} - geolocation disabled
     */
    var geolocationStatus = {
        isActive: false,
        isFollowing: false,
        isRotating: false
    };

    var stats = {
        time: 0,
        distance: 0,
        averageSpeed: 0,
        currentSpeed: 0
    };

    function resetStats () {
        stats = {
            time: 0,
            distance: 0,
            averageSpeed: 0,
            currentSpeed: 0
        };
    };

    function positionCallback (position) {

    };

    /**
     * @description
     * Enable the geolocation (activate GPS, geolocate)
     * 
     * @returns promise
     *      true if all correct, false otherwise
     */
    geolocationService.enable = function () {
        return false;
    };

    /**
     * @description
     * Disable the geolocation
     * 
     * @returns
     *      true if all correct, false otherwise
     */
    geolocationService.disable = function () {
        return false;
    };

    /**
     * @description
     * Getter GPS status
     * 
     * @returns
     *      true if GPS active, false otherwise
     */
    geolocationService.isGPSActive = function () {
        return false;
    };

    /**
     * @description
     * Start recording stats
     * 
     * @returns
     *      true if all correct, false otherwise
     */
    geolocationService.startRecording = function () {
        return false;
    };

    /**
     * @description
     * Pause the stats record saving the state
     * 
     * @returns
     *      true if all correct, false otherwise
     */
    geolocationService.pauseRecording = function () {
        return false;
    };

    /**
     * @description
     * Resume to record stats from the last saved moment
     * 
     * @returns
     *      true if all correct, false otherwise
     */
    geolocationService.resumeRecording = function () {
        return false;
    };

    /**
     * @description
     * Stop to record stats from the last saved moment
     * 
     * @returns
     *      all the recorded stats
     */
    geolocationService.stopRecording = function () {
        return false;
    };

    /**
     * @description
     * Stop to record stats from the last saved moment
     * 
     * @throws NoStatsException
     *      if record never started
     * 
     * @returns
     *      all the recorded stats
     */
    geolocationService.getStats = function () {
        return false;
    };

    return geolocationService;
});