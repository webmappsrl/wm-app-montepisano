var gulp = require('gulp'),
    gutil = require('gulp-util'),
    bower = require('bower'),
    concat = require('gulp-concat'),
    sass = require('gulp-sass'),
    minifyCss = require('gulp-minify-css'),
    rename = require('gulp-rename'),
    sh = require('shelljs'),
    sourcemaps = require('gulp-sourcemaps');


var paths = {
    sass: ['./www/core/styles/**/*.scss'],
    sassRoot: './www/core/styles/style.scss',
    cssDest: './www/core/css/'
};

gulp.task('serve:before', ['sass','watch']);

gulp.task('sass', function(done) {
    gulp.src(paths.sassRoot)
    // .pipe(sourcemaps.init())
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest(paths.cssDest))
    .pipe(minifyCss({
        keepSpecialComments: 0
    }))
    .pipe(rename({
        extname: '.min.css'
    }))
    // .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.cssDest))
    .on('end', done);
});

gulp.task('watch', function() {
    gulp.watch(paths.sass, ['sass']);
});

gulp.task('install', ['git-check'], function() {
    return bower.commands.install()
    .on('log', function(data) {
        gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
    if (!sh.which('git')) {
        console.log(
            '  ' + gutil.colors.red('Git is not installed.'),
            '\n  Git, the version control system, is required to download Ionic.',
            '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
            '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
        );
        process.exit(1);
    }
    done();
});