import gulp from 'gulp';
import eslint from 'gulp-eslint';

import {join as P} from 'path';

import {
  PROJECT_ROOT,
  SOURCE_ROOT,
} from './constants';


// Lint
gulp.task('lint', () => {
  if (process.env.SKIP_LINT) {
    return;
  }
  return gulp.src([
    P(SOURCE_ROOT, '**/*.js'),
  ])
    .pipe(eslint({
      ignorePath: P(PROJECT_ROOT, '.eslintignore'),
    }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});
