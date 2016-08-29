import gulp from 'gulp';
import babel from 'gulp-babel';
import plumber from 'gulp-plumber';
import sourcemaps from 'gulp-sourcemaps';

import _ from 'lodash';
import del from 'del';
import es from 'event-stream';
import fs from 'fs';
import {join as P} from 'path';

import {
  PROJECT_ROOT,
  SOURCE_ROOT,
  DIST_ROOT,
} from './constants';

const babelConfig = JSON.parse(fs.readFileSync(P(__dirname, '../.babelrc')));

gulp.task('clean', ['clean:dist']);
gulp.task('build', ['build:scripts', 'build:static']);

// Clean
gulp.task('clean:dist', function() {
  return del([
    `${DIST_ROOT}/**`,
  ]);
});

// Build
gulp.task('build:scripts', () =>
  es.concat(
    _([SOURCE_ROOT]).map((src) =>
      buildJavascript(src, DIST_ROOT)
    ).value()));
gulp.task('build:static', () =>
  es.concat(
    // Copy swfobject assets
    gulp.src(P(PROJECT_ROOT, 'static/**'))
      .pipe(gulp.dest(P(DIST_ROOT, 'static'))),
  ));

//
// Helper functions
//
function buildJavascript(sources, dest, babelPlugins = []) {
  if (!_.isArray(sources)) {
    sources = [sources];
  }
  return es.concat(_.map(sources, (src) => {
    return gulp.src(P(src, '**/*.js'))
      .pipe(plumber())
      .pipe(sourcemaps.init())
      .pipe(babel({
        presets: babelConfig.presets,
        plugins: babelPlugins,
      }))
      .pipe(sourcemaps.write('.', {
        sourceRoot(_file) {
          return src;
        },
        includeContent: false,
      }))
      .pipe(plumber.stop())
      .pipe(gulp.dest(dest));
  }));
}
