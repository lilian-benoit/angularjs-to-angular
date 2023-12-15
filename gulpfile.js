
var gulp = require('gulp'),
    webserver = require('gulp-webserver'),
    del = require('del'),
    sass = require('gulp-sass'),
    karma = require('gulp-karma'),
    jshint = require('gulp-jshint'),
    sourcemaps = require('gulp-sourcemaps'),
    spritesmith = require('gulp.spritesmith'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    uglify = require('gulp-uglify'),
    gutil = require('gulp-util'),
    ngAnnotate = require('browserify-ngannotate');

var CacheBuster = require('gulp-cachebust');
var cachebust = new CacheBuster();

/////////////////////////////////////////////////////////////////////////////////////
//
// cleans the build output
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('clean', function (cb) {
    del([
        'dist'
    ], cb);
});

/////////////////////////////////////////////////////////////////////////////////////
//
// runs bower to install frontend dependencies
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('bower', function() {

    var install = require("gulp-install");

    return gulp.src(['./bower.json'])
        .pipe(install());
});

/////////////////////////////////////////////////////////////////////////////////////
//
// runs sass, creates css source maps
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('build-css', ['clean'], function() {
    return gulp.src('./ng1/styles/*')
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(cachebust.resources())
        .pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest('./dist/ng1'));
});

/////////////////////////////////////////////////////////////////////////////////////
//
// fills in the Angular template cache, to prevent loading the html templates via
// separate http requests
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('build-template-cache', ['clean'], function() {
    
    var ngHtml2Js = require("gulp-ng-html2js"),
        concat = require("gulp-concat");
    
    return gulp.src("./ng1/partials/*.html")
        .pipe(ngHtml2Js({
            moduleName: "todoPartials",
            prefix: "/partials/"
        }))
        .pipe(concat("templateCachePartials.js"))
        .pipe(gulp.dest("./dist/ng1"));
});

/////////////////////////////////////////////////////////////////////////////////////
//
// runs jshint
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('jshint', function() {
    gulp.src('/ng1/js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

/////////////////////////////////////////////////////////////////////////////////////
//
// runs karma tests
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('test', ['build-js'], function() {
    var testFiles = [
        './ng1/test/unit/*.js'
    ];

    return gulp.src(testFiles)
        .pipe(karma({
            configFile: 'karma.conf.js',
            action: 'run'
        }))
        .on('error', function(err) {
            console.log('karma tests failed: ' + err);
            throw err;
        });
});
/////////////////////////////////////////////////////////////////////////////////////
//
// Build a minified Javascript bundle - the order of the js files is determined
// by browserify
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('build-js', ['clean'], function() {
    var b = browserify({
        entries: './ng1/js/app.js',
        debug: true,
        paths: ['./ng1/js/controllers', './ng1/js/services', './ng1/js/directives', './dist/ng1'],
        transform: [ngAnnotate]
    });

    return b.bundle()
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(cachebust.resources())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify())
        .on('error', gutil.log)
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./dist/ng1/js/'));
});

/////////////////////////////////////////////////////////////////////////////////////
//
// full build (except sprites), applies cache busting to the main page css and js bundles
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('build', [ 'clean', 'bower','build-css','build-template-cache', 'jshint', 'build-js'], function() {
    return gulp.src('ng1/index.html')
        .pipe(cachebust.references())
        .pipe(gulp.dest('dist/ng1'));
});

/////////////////////////////////////////////////////////////////////////////////////
//
// watches file system and triggers a build when a modification is detected
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('watch', function() {
    return gulp.watch(['./ng1/index.html','./ng1/partials/*.html', './ng1/styles/*.*css', './ng1/js/**/*.js'], ['build']);
});

/////////////////////////////////////////////////////////////////////////////////////
//
// launches a web server that serves files in the current directory
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('webserver', ['watch','build'], function() {
    gulp.src('.')
        .pipe(webserver({
            livereload: false,
            directoryListing: true,
            open: "http://localhost:8000/dist/ng1/index.html"
        }));
});

/////////////////////////////////////////////////////////////////////////////////////
//
// launch a build upon modification and publish it to a running server
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('dev', ['watch', 'webserver']);

/////////////////////////////////////////////////////////////////////////////////////
//
// generates a sprite png and the corresponding sass sprite map.
// This is not included in the recurring development build and needs to be run separately
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('sprite', function () {

    var spriteData = gulp.src('./images/*.png')
        .pipe(spritesmith({
            imgName: 'todo-sprite.png',
            cssName: '_todo-sprite.scss',
            algorithm: 'top-down',
            padding: 5
        }));

    spriteData.css.pipe(gulp.dest('./dist/ng1'));
    spriteData.img.pipe(gulp.dest('./dist/ng1'))
});

/////////////////////////////////////////////////////////////////////////////////////
//
// installs and builds everything, including sprites
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('default', ['sprite','build'/*, 'test'*/]);