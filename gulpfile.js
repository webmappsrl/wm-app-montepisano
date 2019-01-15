var gulp = require('gulp'),
    fs = require('graceful-fs'),
    del = require('del'),
    symlink = require('gulp-symlink'),
    jeditor = require('gulp-json-editor'),
    request = require('request'),
    replace = require('gulp-replace'),
    header = require('gulp-header'),
    source = require('vinyl-source-stream'),
    streamify = require('gulp-streamify'),
    rename = require('gulp-rename'),
    sh = require('shelljs'),
    yargs = require('yargs'),
    version = require('./version.json');


yargs.usage('Usage: $0 <command> [options]')
    .command('build', 'Create, Update and generate Ionic platforms and resources  of the istance of Webmapp')
    .command('create', 'Create the istance of Webmapp')
    .example('$0 create -i webmapp_demo_app -u http://pnfc.j.webmapp.it/', 'Create the istance of Webmapp')
    .command('update', 'update the istance of Webmapp')
    .command('update', 'update the istance of Webmapp')
    .example('$0 update -i webmapp_demo_app -u http://pnfc.j.webmapp.it/', 'update the istance of Webmapp')
    .command('set', 'set config.json e con -c recupera config.json da url remoto')
    .example('$0 config -i webmapp_demo_app -c http://pnfc.j.webmapp.it/config.js', 'update the istance of Webmapp')
    .command('update-instance', 'aggiorna il core dell\'istanza con i files del core')
    .demandCommand(1, '')
    .example('$0 update-instance -i webmapp_demo_app')
    .alias('i', 'instance')
    .nargs('i', 1)
    .describe('i', 'Instance Name to create')
    .alias('u', 'url')
    .nargs('u', 1)
    .describe('u', 'Url from get the config')
    .alias('c', 'config')
    .nargs('c', 1)
    .describe('c', 'file used for config')
    .alias('v', 'versionType')
    .nargs('v', 1)
    .describe('v', 'Type of version to build (internal, beta, minor, major)')
    .epilog('(c) Webmapp 2017');

var CONSOLE_COLORS = {
    Reset: "\x1b[0m",
    Bright: "\x1b[1m",
    Dim: "\x1b[2m",
    Underscore: "\x1b[4m",
    Reverse: "\x1b[7m",
    Hidden: "\x1b[8m",

    FgBlack: "\x1b[30m",
    FgRed: "\x1b[31m",
    FgGreen: "\x1b[32m",
    FgYellow: "\x1b[33m",
    FgBlue: "\x1b[34m",
    FgMagenta: "\x1b[35m",
    FgCyan: "\x1b[36m",
    FgWhite: "\x1b[37m",

    BgBlack: "\x1b[40m",
    BgRed: "\x1b[41m",
    BgGreen: "\x1b[42m",
    BgYellow: "\x1b[43m",
    BgBlue: "\x1b[44m",
    BgMagenta: "\x1b[45m",
    BgCyan: "\x1b[46m",
    BgWhite: "\x1b[47m"
};

function debug(message) {
    console.debug(CONSOLE_COLORS.Dim + '[DEBUG]' + CONSOLE_COLORS.Reset + ' ' + message)
}
function info(message) {
    console.info(CONSOLE_COLORS.FgCyan + '[INFO] ' + CONSOLE_COLORS.Reset + ' ' + message)
}
function log(message) {
    console.log(CONSOLE_COLORS.FgWhite + '[LOG]  ' + CONSOLE_COLORS.Reset + ' ' + message)
}
function warn(message) {
    console.warn(CONSOLE_COLORS.FgYellow + '[WARN] ' + CONSOLE_COLORS.Reset + ' ' + message)
}
function error(message) {
    console.error(CONSOLE_COLORS.FgRed + '[ERROR]' + CONSOLE_COLORS.Reset + ' ' + message)
}

var argv = yargs.argv,
    config_xml = '',
    instance_name = 'default';

gulp.task('build', ['create', 'update'/*, 'post-install'*/]);

gulp.task('node_modules_link', function () {
    return gulp.src('bare/node_modules')
        .pipe(symlink('instances/' + instance_name + '/node_modules', {
            force: true
        }));
});

gulp.task('create', function () {

    if (argv.instance) {
        instance_name = argv.instance;
    }
    var dir = 'instances/' + instance_name;

    if (!fs.existsSync('instances')) {
        fs.mkdirSync('instances');
    }
    // create
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);

        return gulp.copy('bare', dir)

    } else {
        warn('instance already exists');
    }

});

/// TODO: aggiorna solo il core
gulp.task('update', ['create'], function () {
    if (argv.instance) {
        instance_name = argv.instance;
    }

    var dir = 'instances/' + instance_name,
        url = "";

    if (argv.url) {
        url = argv.url;
    } else {
        warn("missing url");
        url = "http://api.webmapp.it/j/" + instance_name + ".j.webmapp.it/";
        info("using default url: " + url);
    }

    // se esiste istanza
    if (fs.existsSync(dir)) {
        var infoUrl = url + '/info.json',
            config = url + '/config.json',
            resources = url + '/resources/';

        // estraggo le info
        request({
            url: infoUrl,
            headers: {
                'User-Agent': 'request'
            }
        }).pipe(source(infoUrl))
            .pipe(streamify(jeditor(function (repositories) {
                repo = (repositories);
                config_xml = {
                    id: repo["config.xml"].id,
                    name: repo["config.xml"].name,
                    description: repo["config.xml"].description,
                    version: version["version"]
                };

                gulp.getUrlFile('config.json', config, dir + '/www/config/')
                    .on('end', function () {
                        gulp.updateConfigXML(config_xml);
                    });

                gulp.setFont('Abel');

                gulp.getUrlFile('icon.png', resources + 'icon.png', dir + '/resources/');
                gulp.getUrlFile('splash.png', resources + 'splash.png', dir + '/resources/');

                sh.exec('ionic cordova resources', {
                    cwd: dir
                });

                return repositories;

            })));
    } else {
        warn("Instance doesn't exits. Create first.");
    }
});

gulp.task('set', function () {
    var destDir = 'bare/www/',
        newConfUrl = '',
        infoUrl = '';

    if (argv.config) {
        if (argv.config.substring(0, 4) === "http") {
            newConfUrl = argv.config;
            if (newConfUrl.substring(-1) !== '/') {
                newConfUrl += '/';
            }
        } else {
            newConfUrl = "http://api.webmapp.it/j/" + argv.config + ".j.webmapp.it/";
            info("using default url: " + newConfUrl);
        }

        gulp.src(['bare/www/.index.html'])
            .pipe(rename('index.html'))
            .pipe(gulp.dest(destDir));

        request({
            url: newConfUrl + 'info.json',
            headers: {
                'User-Agent': 'request'
            }
        })
            .pipe(source(newConfUrl + 'info.json'))
            .pipe(streamify(jeditor(function (repositories) {
                repo = (repositories);
                config_xml = {
                    id: repo["config.xml"].id,
                    name: repo["config.xml"].name,
                    description: repo["config.xml"].description,
                    version: version["version"]
                };

                gulp.getUrlFile('config.json', newConfUrl + '/config.json', destDir + '/config/')
                    .on('end', function () {
                        gulp.updateConfigXML(config_xml);
                    });

                return repositories;
            })));
    }
    else {
        warn('Missing config base url');
        error("------------------------- Aborting -------------------------");
    }
});

gulp.task('test', function () {
    sh.exec('npm test');
})

gulp.task('clean', function () {
    return del('instances/**/*', {
        force: true
    });
});

/** copia index in istanza */
gulp.task('generate-index', function () {
    var destDir = 'bare/www/';

    if (argv.instance) {
        destDir = 'instances/' + argv.instance + "/www";
    }

    gulp.src(['bare/www/.index.html'])
        .pipe(rename('index.html'))
        .pipe(gulp.dest(destDir));
});

/** aggiorna il config.xml */
gulp.task('edit-config-xml', ['create'], function () {
    gulp.updateConfigXML(config_xml);
});

gulp.task('post-install', ['update'], function (callback) {
    var dir = 'instances/' + instance_name;

    if (argv.instance) {
        dir = 'instances/' + argv.instance;
    }
    sh.exec('ionic cordova platform add ios', {
        cwd: dir
    });
    sh.exec('ionic cordova platform add android', {
        cwd: dir
    });
    sh.exec('ionic cordova resources --force', {
        cwd: dir
    });
});

/** genera le risorse */
gulp.task('add-resources', function (callback) {
    var dir = 'instances/' + instance_name;

    if (argv.instance) {
        dir = 'instances/' + argv.instance;
    }
    sh.exec('ionic cordova resources', {
        cwd: dir
    });
});

gulp.task('update-instance', function () {
    if (argv.instance) {
        instance_name = argv.instance;
    }

    var dir = 'instances/' + instance_name;

    sh.exec('rm ' + dir + '/config.xml');
    sh.exec('cp bare/config.xml ' + dir + '/config.xml');

    dir += '/www';

    return gulp.copy('bare/www', dir);
});

gulp.task('complete-update', function () {
    if (argv.instance) {
        instance_name = argv.instance;
    } else {
        log("missing instance name");
        log("aborting...");
        return;
    }

    if (argv.url) {
        url = argv.url;
    } else {
        warn("missing url");
        url = "http://api.webmapp.it/j/" + instance_name + ".j.webmapp.it/";
        info("using default url: " + url);
    }

    sh.exec("gulp sass", {
        cwd: 'bare/'
    });
    sh.exec("gulp update-instance -i " + instance_name);
    sh.exec("gulp update -i " + instance_name + " -u " + url);
});

gulp.task('sass', function () {
    var dir = "bare/";

    if (argv.instance) {
        dir = "instances/" + argv.instance + "/";
    }

    sh.exec("gulp sass", {
        cwd: dir
    });
});

gulp.task('test', function () {
    sh.exec('npm test');
});

gulp.copy = function (src, dest) {
    gulp.start('node_modules_link');

    return gulp.src([src + '/**', '!' + src + '/node_modules', '!' + src + '/node_modules/**', '!' + src + '/platforms', '!' + src + '/platforms/**', '!' + src + '/www/config/*'])
        .pipe(gulp.dest(dest));

};

gulp.getUrlFile = function (file, src, dest) {
    return request({
        url: src,
        headers: {
            'User-Agent': 'request'
        }
    })
        .pipe(source(file))
        .pipe(gulp.dest(dest));
};

gulp.updateConfigXML = function (config) {
    var dir = 'instances/' + instance_name;

    if (instance_name === 'default') {
        dir = 'bare/';
    }

    var config_file = dir + '/config.xml',
        configJson_file = dir + '/www/config/config.json';

    var edit_tag = '<widget id="' + config.id + '" version="' + config.version + '"',
        edit_name = '<name>' + config.name + '</name>',
        edit_desc = '<description>' + config.description + '</description>',
        edit_version = '"VERSION":"' + config.version + '","appId":"' + config.id + '"';

    gulp.start('generate-index');

    gulp.src(configJson_file)
        .pipe(replace(/"VERSION":""/, edit_version))
        .pipe(gulp.dest(dir + '/www/config/'));

    return gulp.src(config_file)
        .pipe(replace(/<widget (id=")([a-zA-Z0-9:;\.\s\(\)\-\,]*)(") (version=")([a-zA-Z0-9:;\.\s\(\)\-\,]*)(")/i, edit_tag))
        .pipe(replace(/(<name\b[^>]*>)[^<>]*(<\/name>)/i, edit_name))
        .pipe(replace(/(<description\b[^>]*>)[^<>]*(<\/description>)/i, edit_desc))
        .pipe(gulp.dest(dir));
};

gulp.setFont = function (fontFamily) {
    var dir = 'instances/' + instance_name + '/www/core/styles/generic';

    return gulp.src(dir + "/_variables.scss")
        .pipe(replace(/\$main-font-family: '(.*)', sans-serif;/g, "$main-font-family: '" + fontFamily + "', sans-serif;"))
        .pipe(replace(/\$title-font-family: '(.*)', sans-serif;/g, "$title-font-family: '" + fontFamily + "', sans-serif;"))
        .pipe(gulp.dest(dir));
};

gulp.getChanges = function (oldVersion, newVersion) {
    sh.exec('git log --pretty=oneline --abbrev-commit BETA_' + oldVersion + '...BETA_' + newVersion + ' > tmp.txt');
    return gulp.src('tmp.txt')
        .pipe(replace(/^(.{7} )/gm, ""))
        .pipe(replace(/^[^F].*$\n/gm, ""))
        .pipe(gulp.dest('./'));
};

/**
 * @description
 * Update the version number, takes all the changes from previous version and create
 * changelog.txt and lastChanges.txt, push all the changes to remote and tag the new
 * version
 *
 * @param {string} -v [optional]
 *      allow to choose the type of version update:
 *          - internal: increments by 0.0.0001, max x.x.xx99
 *          - beta    : increments by 0.0.0100, max x.x.99xx
 *          - minor   : increments by 0.1.0000
 *          - major   : increments by 1.0.0
 *      In every case the previous values become 0
 *      e.g.
 *      version  | internal |   beta   | minor | major
 *      0.1.1603   0.1.1604   0.1.1700   0.2.0   1.0.0
 */
gulp.task('push-version', function () {
    var versionType = 'internal'
    if (argv.versionType) {
        versionType = argv.versionType;
    }

    var oldVersion = JSON.parse(fs.readFileSync('./version.json')).version;
    var versionArray = oldVersion.split('.');

    switch (versionType) {
        case 'internal':
            if ((+versionArray[2]) % 100 === 99) {
                warn("Maximum internal version reached")
                return;
            }
            versionArray[2] = +versionArray[2] + 1;
            break;
        case 'beta':
            if (+versionArray[2] >= 9900) {
                warn("Maximum beta version reached")
                return;
            }
            versionArray[2] = +versionArray[2] + 100;
            versionArray[2] = versionArray[2] - (versionArray[2] % 100);
            break;
        case 'minor':
            versionArray[1] = +versionArray[1] + 1;
            versionArray[2] = 0;
            break;
        case 'major':
            versionArray[0] = +versionArray[0] + 1;
            versionArray[1] = 0;
            versionArray[2] = 0;
            break;
        default:
            versionArray[2] = +versionArray[2] + 1;
            break;
    }

    var newVersion = versionArray[0] + '.' + versionArray[1] + '.' + versionArray[2];

    return Promise.all([
        new Promise(function (resolve, reject) {
            sh.exec('git log --pretty=oneline --abbrev-commit BETA_' + oldVersion + '..HEAD > lastChanges.txt');
            return gulp.src('lastChanges.txt')
                .pipe(replace(/^(.{1,6} )(.*)\n/gm, "")) // Remove all multiline messages
                .pipe(replace(/^([^ ]{8,})(.*)\n/gm, "")) // Remove all multiline messages
                .pipe(replace(/^(.{7} )/gm, "")) // Remove commit id
                .pipe(replace(/^[^PROD: ].*$\n/gm, "")) // Select only commit that start with A TODO CHANGE TO PROD
                .pipe(replace(/^(.{6})/gm, "")) // Remove start of commit (char A) TODO CHANGE TO PROD
                .on('error', reject)
                .pipe(gulp.dest('./'))
                .on('end', resolve);
        })
    ]).then(function () {
        return Promise.all([
            new Promise(function (resolve, reject) {
                sh.exec('touch changelog.txt');
                return gulp.src('changelog.txt')
                    .pipe(header(fs.readFileSync('lastChanges.txt')))
                    .pipe(header('Version ' + newVersion + '\n'))
                    .on('error', reject)
                    .pipe(gulp.dest('./'))
                    .on('end', resolve);
            })
        ])
            .then(function () {
                return Promise.all([
                    new Promise(function (resolve, reject) {
                        return gulp.src('version.json')
                            .pipe(replace(/"version": "(.{5,10})"/gm, '"version": "' + newVersion + '"'))
                            .on('error', reject)
                            .pipe(gulp.dest('./'))
                            .on('end', resolve);
                    })
                ])
                    .then(function () {
                        //GIT ADD COMMIT PUSH TAG
                        sh.exec('git add -A');
                        sh.exec('git commit -m "Ready for ' + newVersion + '"');
                        sh.exec('git push origin master');
                        sh.exec('git tag BETA_' + newVersion);
                        sh.exec('git push origin BETA_' + newVersion);
                    });
            });
    });
});
