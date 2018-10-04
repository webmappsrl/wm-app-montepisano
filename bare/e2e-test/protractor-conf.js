exports.config = {
    seleniumAddress: 'http://localhost:4723/wd/hub',
    specs: [
        './**/*.spec.js'
    ],
    capabilities: {
        noReset: true,
        browserName: '',
        platformName: 'Android',
        autoWebview: true,
        appActivity: 'it.webmapp.webmappt.MainActivity',
        appPackage: 'it.webmapp.webmappt',
        // setWebContentsDebuggingEnabled: 'true',
        deviceName: 'MyADV'
    },
    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 100000,
        isVerbose: true
    },

    baseUrl: 'localhost:8100'
};
