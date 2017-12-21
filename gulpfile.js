var gulp = require('gulp'),
    fs = require('graceful-fs'),
    del = require('del'),
    symlink = require('gulp-symlink'),
    jeditor = require('gulp-json-editor'),
    request = require('request'),
    replace = require('gulp-replace'),
    source = require('vinyl-source-stream'),
    streamify = require('gulp-streamify'),
    rename = require('gulp-rename'),
    sh = require('shelljs'),
    yargs = require('yargs');


yargs.usage('Usage: $0 <command> [options]')
    .command('build', 'Create, Update and generate Ionic platforms and resources  of the istance of Webmapp')
    .command('create', 'Create the istance of Webmapp')
    .example('$0 create -i webmapp_demo_app -u http://pnfc.j.webmapp.it/', 'Create the istance of Webmapp')
    .command('update', 'update the istance of Webmapp')
    .command('update', 'update the istance of Webmapp')
    .example('$0 update -i webmapp_demo_app -u http://pnfc.j.webmapp.it/', 'update the istance of Webmapp')
    .command('set', 'set config.js in bare/index.html e con -c recupera config.js da url remoto')
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
    .epilog('(c) Webmapp 2017');

var argv = yargs.argv,
    config_xml = '';
instance_name = 'default';

gulp.task('build', ['create', 'update' /*, 'post-install'*/ ]);

gulp.task('node_modules_link', function () {
    return gulp.src('bare/node_modules')
        .pipe(symlink('instances/' + instance_name + '/node_modules', {
            force: true
        })) // Write to the destination folder 
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
        console.warn('[WARN] instance already exits');
    }

});

/// TODO: aggiorna solo il core
gulp.task('update', ['create'], function () {
    console.log('lancio update...');

    if (argv.instance) {
        instance_name = argv.instance;
    }
    var dir = 'instances/' + instance_name;
    // se esiste istanza
    if (fs.existsSync(dir)) {

        var info = argv.url + '/info.json',
            config = argv.url + '/config.js'
        resources = argv.url + '/resources/';;
        // estraggo le info
        request({
                url: info,
                headers: {
                    'User-Agent': 'request'
                }
            })
            .pipe(source(info))
            // .pipe(fs.access(info))
            .pipe(streamify(jeditor(function (repositories) {
                repo = (repositories);
                config_xml = {
                    id: repo["config.xml"].id,
                    name: repo["config.xml"].name,
                    description: repo["config.xml"].description,
                    version: repo["config.xml"].version
                };

                gulp.updateConfigXML(config_xml);

                return repositories;

            })));

        gulp.getUrlFile('config.js', config, dir + '/www/config/');

        gulp.getUrlFile('icon.png', resources + 'icon.png', dir + '/resources/');
        gulp.getUrlFile('splash.png', resources + 'splash.png', dir + '/resources/');

        //gulp.start('generate-resources');

    } else {
        console.warn('[WARN] instance doesn\'t exits. Create first.');
    }
});

gulp.task('set', function () {

    var newConfUrl = 'config/config.js';
    var destDir = 'bare/www/';

    if (argv.config) {
        newConfUrl = argv.config;

        if (!newConfUrl.startsWith("http://")) {
            newConfUrl = "http://" + newConfUrl;
        }
        if (!newConfUrl.endsWith('config.js')) {
            newConfUrl = newConfUrl + '/config.js';
        } else if (!newConfUrl.endsWith('/') && !newConfUrl.endsWith('config.js')) {
            newConfUrl = newConfUrl + '/';
        }

    }
    if (argv.instance) {
        destDir = 'instances/' + destDir + '/www/';
    }

    gulp.src(['bare/www/.index.html'])
        .pipe(replace(/\$CONFIG/g, newConfUrl))
        .pipe(rename('index.html'))
        .pipe(gulp.dest(destDir));
});

gulp.task('clean', function () {
    return del('instances/**/*', {
        force: true
    });
});

/** copia index in istanza */
gulp.task('generate-index', function () {

    var newConfUrl = 'config/config.js';
    var destDir = 'bare/www/';
    var dir = 'instances/' + instance_name;

    if (argv.instance) {
        destDir = 'instances/' + argv.instance + "/www";
    }

    gulp.src(['bare/www/.index.html'])
        .pipe(replace(/\$CONFIG/g, newConfUrl))
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
    sh.exec('ionic cordova resources --verbose', {
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

    var dir = 'instances/' + instance_name + '/www';

    return gulp.copy('bare/www', dir);
});

gulp.task('complete-update', function () {
    if (argv.instance) {
        instance_name = argv.instance;
    }
    else {
        console.log("missing instance name");
        console.log("aborting...");
        return;
    }

    if (argv.url) {
        url = argv.url;
    }
    else {
        console.log("missing url");
        console.log("aborting...");
        return
    }

    sh.exec("gulp sass", {
        cwd: 'bare/'
    });
    sh.exec("gulp update-instance -i " + instance_name);
    sh.exec("gulp update -i " + instance_name + " -u " + url);
});

gulp.copy = function (src, dest) {

    var result = gulp.src([src + '/**', '!' + src + '/node_modules', '!' + src + '/node_modules/**', '!' + src + '/platforms', '!' + src + '/platforms/**'])
        .pipe(gulp.dest(dest));

    gulp.start('node_modules_link');

    return result;

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

    var dir = 'instances/' + instance_name,
        config_file = dir + '/config.xml';

    var edit_tag = '<widget id="' + config.id + '" version="' + config.version + '"',
        edit_name = '<name>' + config.name + '</name>',
        edit_desc = '<description>' + config.description + '</description>';

    gulp.start('generate-index');

    return gulp.src(config_file)
        .pipe(replace(/<widget (id=")([a-zA-Z0-9:;\.\s\(\)\-\,]*)(") (version=")([a-zA-Z0-9:;\.\s\(\)\-\,]*)(")/i, edit_tag))
        .pipe(replace(/(<name\b[^>]*>)[^<>]*(<\/name>)/i, edit_name))
        .pipe(replace(/(<description\b[^>]*>)[^<>]*(<\/description>)/i, edit_desc))
        .pipe(gulp.dest(dir));
};