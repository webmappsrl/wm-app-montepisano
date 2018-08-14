// Karma configuration
// Generated on Thu May 17 2018 10:22:57 GMT+0200 (CEST)

module.exports = function (config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: './www',


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],


        // list of files / patterns to load in the browser
        files: [
            'core/lib/proj4js/proj4.js',
            'core/lib/LPF.js',
            'core/lib/jquery/dist/jquery.min.js',
            'core/lib/ionic/js/ionic.bundle.js',
            'core/lib/angular-mocks/angular-mocks.js',
            'core/lib/clipboard/dist/clipboard.min.js',
            'core/lib/jsSHA/src/sha1.js',
            'core/lib/porter-stemmer/porterStemmer1980.min.js',
            'core/lib/js-search/dist/js-search.min.js',
            'core/lib/igTruncate/igTruncate.js',
            'core/lib/JsBarcode/dist/JsBarcode.all.min.js',
            'core/lib/angular-translate/angular-translate.min.js',
            'core/lib/angular-translate-loader-static-files/angular-translate-loader-static-files.min.js',
            'core/lib/leaflet/leaflet.js',
            'core/lib/leaflet_plugin/leaflet-hash-mod/leaflet-hash.js',
            'core/lib/leaflet_plugin/leaflet.groupedlayercontrol/leaflet.groupedlayercontrol.min.js',
            'core/lib/leaflet_plugin/leaflet.utfgrid.js',
            'core/lib/leaflet_plugin/leaflet.vector-markers/leaflet-vector-markers.min.js',
            'core/lib/leaflet_plugin/leaflet-control-locate/L.Control.Locate.min.js',
            'core/lib/leaflet_plugin/leaflet-markercluster/leaflet.markercluster.js',
            'core/lib/leaflet_plugin/leaflet.kkn.min.js',
            // 'core/lib/leaflet_plugin/leaflet.geometryutil.js',
            'core/lib/leaflet_plugin/leaflet.almostover.js',
            'core/lib/leaflet_plugin/L.UTFGrid-min.js',
            'core/lib/leaflet_plugin/leaflet-polylinedecorator/dist/leaflet.polylineDecorator.js',
            'core/lib/leaflet_plugin/leaflet-knn/leaflet-knn.js',
            'core/lib/leaflet_plugin/sql.js',
            'core/lib/leaflet_plugin/Leaflet.TileLayer.MBTiles.js',
            'core/lib/ngCordova/dist/ng-cordova.js',
            'core/lib/pouchdb/pouchdb.min.js',
            'cordova.js',
            'core/lib/turf/outTurf.js',
            'core/lib/ionic-toast/dist/ionic-toast.bundle.min.js',
            'core/lib/ng-country-select/dist/ng-country-select.js',
            'core/js/app.js',
            'config/config.js',
            // 'core/js/settings/*.js',
            'core/js/settings/globalVariables.js',
            'core/js/settings/configProvider.js',
            'core/js/settings/translate.js',
            'core/js/settings/overwrite.js',
            'core/js/settings/run.js',
            'core/js/settings/filters.js',
            'core/js/settings/compile.js',
            'core/js/settings/routes.js',
            'core/js/services/*.js',
            'core/js/components/**/*.js'
        ],


        // list of files / patterns to exclude
        exclude: [
        ],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
        },


        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress'],


        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // Configure how the browser console is logged, all optional values
        // level: define the desire log level
        //      possible values "debug", "log"
        // terminal: enable/disable log
        // format: the format of the log
        //      possible values (combinable):
        //      %t - log type (info, warning, error...)
        //      %T - log type UPEERCASE
        //      %b - browser
        //      %m - message
        // path: set the path of the log file
        browserConsoleLogOptions: {
            terminal: true
        },


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Chrome'],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity
    })
}
