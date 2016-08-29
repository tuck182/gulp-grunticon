/* global args */

import gulp from 'gulp';
import gutil from 'gulp-util';
import adHoc from 'gulp-adhoc';

import minimist from 'minimist';
import requireDir from 'require-dir';


global.GULP_ROOT = __dirname;

// Set up ad-hoc command line task chains
adHoc(gulp, gutil.env);

// Support command line switches
global.args = minimist(process.argv.slice(2));
process.env.NODE_ENV = args.env || process.env.NODE_ENV || 'development';

// Load all sub-tasks
requireDir('./gulp.d', {recurse: true});

// Default: build application
gulp.task('default', ['build']);
