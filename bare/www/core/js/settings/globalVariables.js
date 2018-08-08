var templateBasePath = 'core/',
    templateCustomPath = '';

var ERRORS = {
    GENERIC: {
        code: 0,
        message: "Si è verificato un errore"
    },
    GPS_DISABLED: {
        code: 1,
        message: "GPS is not active"
    },
    GEOLOCATION_ACTIVE: {
        code: 2,
        message: "La geolocalizzazione è già attiva"
    }
};