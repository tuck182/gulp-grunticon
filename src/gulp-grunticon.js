/*
 * gulp-grunticon
 *
 * Based on grunticon: https://github.com/filamentgroup/grunticon
 */

// DEBUG:
import throughConcurrent from 'through2-concurrent';
import gutil from 'gulp-util';

import _ from 'lodash';
import fsLib from 'fs';
import Handlebars from 'handlebars';
import path from 'path';
import Promise from 'bluebird';
import sharp from 'sharp';
import uglify from 'uglify-js';

import Colorfy from './colorfy';
import Encoder from './encoder';

const fs = Promise.promisifyAll(fsLib);

function processSvgToPng(file, outputBase, gulpFiles, svgFiles, pngFiles) {
  const filename = path.parse(file.path);
  const pngFile = new gutil.File({
    base: path.join(__dirname, '.'),
    cwd: __dirname,
    path: path.join(__dirname, `${outputBase || filename.name}.png`),
  });
  const svgFile = new gutil.File({
    base: path.join(__dirname, '.'),
    cwd: __dirname,
    path: path.join(__dirname, `${outputBase || filename.name}.svg`),
    contents: file.contents,
  });

  return sharp(file.contents)
    .png()
    .toBuffer()
    .then((buffer) => {
      pngFile.contents = buffer;
      gulpFiles.push(pngFile);
      pngFiles.push(pngFile);
      svgFiles.push(svgFile);
    }).catch((err) => {
      throw err;
    });
}

export default function(configParams) {
  const config = _.defaultsDeep({}, configParams || {}, {
    datasvgcss: 'icons.data.svg.css',
    datapngcss: 'icons.data.png.css',
    urlpngcss: 'icons.fallback.css',
    files: {
      loader: path.join( __dirname, 'static', 'grunticon.loader.js'),
      banner: path.join( __dirname, 'static', 'grunticon.loader.banner.js'),
    },
    previewhtml: 'preview.html',
    loadersnippet: 'grunticon.loader.txt',
    cssbasepath: path.sep,
    customselectors: {},
    cssprefix: '.icon-',
    defaultWidth: '400px',
    defaultHeight: '300px',
    colors: {},
    pngfolder: 'png',
    template: './gulp-grunticon.template.hbs',
  });

  const svgFiles = [];
  const pngFiles = [];

  gutil.log('[gulp-grunticon] Converting images');
  return throughConcurrent.obj({maxConcurrency: 10},
  function(file, enc, callback) {
    const gulpFiles = this;

    const filename = path.parse(file.path);
    if (filename.ext === '.svg') {
      file.contents = file.contents.slice(file.contents.indexOf('<svg'));
    }

    let promise;
    const m = filename.base.match(/(.*)\.colors\-([^\.]+)/i);
    if (m) {
      const svgToPngPromises = _.map(new Colorfy(file.path, file.contents.toString(enc)).convert(),
      (output) => {
        const colorSvg = new gutil.File({
          base: path.join(__dirname, '.'),
          cwd: __dirname,
          path: path.join(__dirname, `${output.filename}`),
          contents: new Buffer(output.contents, enc),
        });

        return processSvgToPng(colorSvg, null, gulpFiles, svgFiles, pngFiles);
      });
      svgToPngPromises.push(processSvgToPng(file, m[1], gulpFiles, svgFiles, pngFiles));
      promise = Promise.all(svgToPngPromises);

    } else {
      promise = processSvgToPng(file, null, gulpFiles, svgFiles, pngFiles);
    }
    if (!promise) {
      gutil.log(`Skipping ${filename.base}`);
      return callback();
    }
    return promise
      .then(function () {
        return callback();
      })
      .catch(function(err) {
        return callback(err);
      });
  },

  // flush function:
  function (callback) {
    gutil.log('[gulp-grunticon] Generating templates');

    return Promise.all([
      // Promise.try because path.resolve could error
      fs.readFileAsync(config.files.banner, 'utf8'),
      fs.readFileAsync(config.files.loader, 'utf8'),
      Promise.try(() => fs.readFileAsync(path.resolve(config.template), 'utf8')),
    ]).then(([bannerSource, loaderSource, templateSource]) => {
      if (!templateSource) {
        throw new Error(
          `Failed to load grunticon template from '${path.resolve(config.template)}'`
          + ': empty result');
      }

      // Write the grunticon loader
      this.push(new gutil.File({
        base: path.join(__dirname, '.'),
        cwd: __dirname,
        path: path.join(__dirname, config.loadersnippet),
        contents: new Buffer(
          `${bannerSource}\n${uglify.minify(loaderSource, {
            fromString: true,
          }).code}`, 'utf8'),
      }));

      // Write all CSS files based on converted SVG's/PNG's
      const template = Handlebars.compile(templateSource, {noEscape: true});
      return Promise.map([
        generateCss(svgFiles, template, config.datasvgcss),
        generateCss(pngFiles, template, config.datapngcss),
        generateCss(pngFiles, template, config.urlpngcss),
      ], (cssFile) => {
        this.push(cssFile);
        return null;
      });
    })
    .then(() => {
      callback();
    })
    .catch((err) => {
      gutil.log('Error generating grunticon CSS', err);
      callback(err);
    });
  });
}

function generateCss(files, template, outputPath) {
  return Promise.all(_(files).sortBy((x) => {
    return path.parse(x.path).base;
  }).map((file) => {
    const filePath = path.parse(file.basename);
    const name = filePath.name;

    const encoder = Encoder.create(file, {
      template,
    });
    return encoder.cssAsync(name);
  }).value()).then((cssList) => {
    return new gutil.File({
      base: path.join(__dirname, '.'),
      cwd: __dirname,
      path: path.join(__dirname, outputPath),
      contents: new Buffer(cssList.join('\n\n')),
    });
  });
}
























