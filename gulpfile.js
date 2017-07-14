var gulp = require('gulp'),
    fs = require('graceful-fs'),
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
    .command('create', 'Create the istance of Webmapp')
    .example('$0 create -i webmapp_demo_app -u http://api.webmapp.it/be/starter.cbe.webmapp.it', 'Create the istance of Webmapp')
    .command('update', 'update the istance of Webmapp')
    .example('$0 update -i webmapp_demo_app -u http://api.webmapp.it/be/starter.cbe.webmapp.it', 'update the istance of Webmapp')
    .command('set', 'set config.js in bare/index.html')
    .alias('i', 'instance')
    .nargs('i', 1)
    .describe('i', 'Instance Name to create')
    //.demandOption(['instance'])
    .alias('u', 'url')
    .nargs('u', 1)
    .describe('u', 'Url from get the config')
    //.demandOption(['url'])
    .alias('c', 'config')
    .nargs('c', 1)
    .describe('c', 'file used for config')
    
    .epilog('(c) Webmapp 2017');

var argv = yargs.argv,
    config_xml = '';
    instance_name = 'default';

 
gulp.task('config_link', function () {
    return gulp.src('bare/www/config')
        .pipe(symlink('instances/'+instance_name+'/httpdoc/config')) // Write to the destination folder 
});

gulp.task('templates_link', function () {
    return gulp.src('bare/www/templates')
        .pipe(symlink('instances/'+instance_name+'/httpdoc/templates')) // Write to the destination folder 
});

gulp.task('node_modules_link', function () {
    return gulp.src('bare/node_modules')
        .pipe(symlink('instances/'+instance_name+'/node_modules')) // Write to the destination folder 
});

gulp.task('create', function(){

    if ( argv.instance ){
        instance_name = argv.instance;
    }

    var dir = 'instances/' + instance_name ;

    // create
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
        return gulp.copy( 'bare', dir );
        //gulp.start('update');
        //gulp.start('edit-config-xml');

    } else {
        console.warn( '[WARN] instance already exits');
    }

    

});

/// TODO: aggiorna solo il core
gulp.task( 'update', function(){
    console.log( 'lancio update...' );

    if ( argv.instance ){
        instance_name = argv.instance;
    }
    
    var dir = 'instances/' + instance_name ;

    console.log(dir);

    // se esiste istanza
    if (fs.existsSync(dir)){
        
        // recupero dati da url

        var info = argv.url + '/info.json',
            config = argv.url + '/config.js'
            resources = argv.url + '/resources/';
        ;

        // estraggo le info
        request({
            url: info,
            headers: {
                'User-Agent': 'request'
            }   
        })
        .pipe(source(info))
        .pipe(streamify(jeditor(function (repositories) {
            repo = (repositories);

            // 
            
            config_xml = {
                id: repo["config.xml"].id,
                name: repo["config.xml"].name,
                description: repo["config.xml"].description,
                version: repo["config.xml"].version
            };

            gulp.updateConfigXML(config_xml);

            return repositories;

        })));

        gulp.getUrlFile( 'config.js', config, dir + '/www/config/' );

        gulp.getUrlFile( 'icon.png', resources + 'icon.png', dir + '/resources/' );
        gulp.getUrlFile( 'splash.png', resources + 'splash.png', dir + '/resources/' );

        //gulp.start('generate-resources');

    } else {
        console.warn( '[WARN] instance doesn\'t exits. Create first.');
    }
});

gulp.task('set', function(){
    
    var newConfUrl = 'config/config.js'; 

    if( argv.config){
        newConfUrl = argv.config
    } 

    gulp.src(['bare/www/.index.html'])
        .pipe(replace(/\$CONFIG/g, newConfUrl))
        .pipe(rename('index.html'))
        .pipe(gulp.dest('bare/www/'));

    
});

gulp.task( 'edit-config-xml', ['create'], function(){
    gulp.updateConfigXML(config_xml);
});

gulp.task('generate-resources', function(callback){
    var dir = 'instances/' + instance_name;
    process.chdir(dir);
    sh.cd(dir);
    sh.exec('ionic cordova resources', function(){
    });
});

gulp.task( 'update-bare', function(){

});

gulp.task('build', ['create', 'update']);

gulp.copy= function(src,dest){

    console.log( src+'/node_modules' );

    var result = gulp.src([src + '/**', '!'+src+'/node_modules', '!'+src+'/node_modules/**','!'+src+'/platforms', '!'+src+'/platforms/**'] )
        .pipe(gulp.dest(dest));

    gulp.start( 'node_modules_link' );

    return result;

};

gulp.getUrlFile = function( file, src, dest ){
    return request({
            url: src,
            headers: {
                'User-Agent': 'request'
            }
        })
        .pipe(source(file))
        .pipe(gulp.dest(dest));
};

gulp.updateConfigXML = function( config ){

    var dir = 'instances/' + instance_name,
        config_file = dir + '/config.xml' ;

    var edit_tag = '<widget id="'+config.id+'" version="'+config.version+'"',
        edit_name = '<name>' + config.name+ '</name>',
        edit_desc = '<description>'+config.description+'</description>'
    ;

    return gulp.src( config_file )
        .pipe(replace(/<widget (id=")([a-zA-Z0-9:;\.\s\(\)\-\,]*)(") (version=")([a-zA-Z0-9:;\.\s\(\)\-\,]*)(")/i, edit_tag))
        .pipe(replace(/(<name\b[^>]*>)[^<>]*(<\/name>)/i, edit_name))
        .pipe(replace(/(<description\b[^>]*>)[^<>]*(<\/description>)/i, edit_desc))
        .pipe(gulp.dest(dir));
};


