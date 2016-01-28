/**
 * Gulp
 */

'use strict';

const gulp = require('gulp');
const $ = require('gulp-load-plugins')();

const babel = require('babelify');
const browserSync = require('browser-sync');
const buffer = require('vinyl-buffer');
const browserify = require('browserify');
const path = require('path');
const pngquant = require('imagemin-pngquant');
const source = require('vinyl-source-stream');
const svgo = require('imagemin-svgo');
const svgmin = require('gulp-svgmin');
const watchify = require('watchify');
const runSequence = require('run-sequence');

const d = {
  assets: 'assets/',
  dest: './themes/tyshgc-blog/',
  images: 'images/',
  layouts: 'layouts/',
  script: 'scripts/',
  src: './src/',
  static: 'static/assets/',
  style: 'styles/',
};

let bs;
let timer;


/**
 * Clear Files in dest-dir
 */
gulp.task('clear', ()=> {
  return gulp.src([
      d.dest
    ], {read: false})
    .pipe($.clean());
});


/**
 * jade
 */
gulp.task('compile:jade', ()=> {
  gulp.src(d.src+d.layouts+'/!(_)*.jade')
    .pipe($.plumber())
    .pipe($.jade({
      pretty: true
    }))
    .pipe(gulp.dest(d.dest+d.layouts));
});


 /**
  * Stylus
  */
 gulp.task("compile:stylus", ()=> {
   gulp.src([
     d.src+"app.styl"
   ])
   .pipe($.stylus())
   .pipe($.pleeease())
   .pipe($.minifyCss({
     keepSpecialComments: 0
   }))
   .pipe($.rename({
     extname: ".css"
   }))
   .pipe(browserSync.reload({
     stream: true
   }))
   .pipe(gulp.dest(d.dest+d.static));
});

/**
 * Javascript(ES2015, Babel, watchify, browserify)
 */
function compile(watch) {
  const bundleObject = browserify(d.src+'app.js', {debug: true}).transform(babel);
  const bundler = watch? watchify(bundleObject) : bundleObject;

  function rebundle() {
    bundler.bundle()
      .on('error', function(err) { console.error(err); this.emit('end'); })
      .pipe(source('app.js'))
      .pipe(buffer())
      .pipe($.sourcemaps.init({loadMaps: true }))
      .pipe($.sourcemaps.write('./'))
      .pipe(gulp.dest(d.dest+d.static));
  }

  if (watch) {
    bundler.on('update', ()=> {
      console.log('-> update bundling...');
      rebundle();
    });
  }

  rebundle();
}
function watch() {
  return compile(true);
};
gulp.task('build:javascript', ()=> { return compile(); });
gulp.task('watch:javascript', ()=> { return watch(); });



/**
 * Tasks
 */
gulp.task('watch:base', [
  'compile:jade',
  'compile:stylus'
], ()=> {
  gulp.watch(d.src+'**/*.styus', ['compile:stylus']);
  gulp.watch(d.src+'**/*.jade', ['compile:jade']);
});

/**
 * Watch Start
 */
gulp.task('watch:start', [
  'watch:base',
  'watch:javascript'
], ()=>{

  bs = browserSync.create();
  bs.init({
    open: false,
    proxy: {
      target: '127.0.0.1:1313',
    },
  });

  const callback = ()=> {
    clearTimeout(timer);
    timer = setTimeout(()=> {
      setTimeout(()=> { bs.reload(); }, 1000);
    }, 1000);
  }

  gulp.watch(d.dest+'**/*.html', callback);
  gulp.watch(d.dest+d.statics+'*.js', callback);
  gulp.watch(d.dest+d.statics+'*.css', callback);
});

/**
 * run task
 */
gulp.task('default', [
  //'clear',
  'compile:jade',
  'compile:stylus',
  'watch:start'
]);
