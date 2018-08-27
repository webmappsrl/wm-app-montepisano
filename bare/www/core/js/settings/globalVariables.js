var templateBasePath = 'core/',
    templateCustomPath = '';

/**
 *   0- 99: Global errors
 * 100-200: Geolocation errors
 */
var ERRORS = {
    GENERIC: {
        code: 0,
        message: "An error has occurred"
    },
    CORDOVA_UNAVAILABLE: {
        code: 1,
        message: "Cordova is not available"
    },
    ALREADY_ACTIVE: {
        code: 10,
        message: "This feature is already active, you should deactivate it first"
    },
    UNAVAILABLE: {
        code: 11,
        message: "This feature is not available"
    },
    TEMPORARILY_DISABLED: {
        code: 12,
        message: "This feature is temporarily disabled"
    },
    DISABLED: {
        code: 13,
        message: "This feature is disabled"
    },
    MISSING_ARGUMENTS: {
        code: 20,
        message: "At least on mandatory argument miss"
    },
    GENERIC_GPS: {
        code: 101,
        message: "GPS is not active"
    },
    GPS_DISABLED: {
        code: 102,
        message: "GPS is not active"
    },
    GPS_PERMISSIONS_DENIED: {
        code: 103,
        message: "We are not allowed to use GPS"
    },
    GEOLOCATION_DISABLED: {
        code: 110,
        message: "The geolocation is disabled"
    },
    OUTSIDE_BOUNDING_BOX: {
        code: 111,
        message: "You are currently outside bounding box"
    }
};