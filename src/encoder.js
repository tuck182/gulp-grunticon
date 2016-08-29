import path from 'path';
import sharp from 'sharp';

export default class Encoder {
  static create(file, options) {
    const filePath = path.parse(file.basename);
    const ext = filePath.ext.replace(/^\./, '');

    if (!encoders[ext]) {
      throw new Error(`${file.basename}: No encoder defined for this file type (${ext})`);
    }
    return new encoders[ext](file, options);
  }
}

class DataUriEncoder {
  constructor(file, options) {
    this.file = file;
    this.path = path.parse(this.file.path);
    this.options = options || {};
  }

  encode() {
    return this.file.contents.toString('base64');
  }

  stats() {
    return sharp(this.file.contents)
      .metadata()
      .then((statsResult) => {
        return {
          width: statsResult.width !== '' ? statsResult.width + 'px' : '',
          height: statsResult.height !== '' ? statsResult.height + 'px' : '',
        };
      }).catch((err) => {
        throw err;
      });
  }

  cssAsync() {
    return this.stats()
    .then((stats) => {
      const datauri = this.encode();

      this.customselectors = this.customselectors || {};
      this.prefix = this.prefix || '.icon-';

      const name = this.path.name;

      if (this.customselectors['*']) {
        this.customselectors[name] = this.customselectors[name] || [];
        const selectors = this.customselectors['*'];
        selectors.forEach((el) => {
          const s = name.replace(new RegExp(`(${name})`), el);
          if (this.customselectors[name].indexOf(s) === -1) {
            this.customselectors[name].push(s);
          }
        });
      }


      const data = {
        prefix: this.prefix,
        name,
        datauri,
        width: stats.width,
        height: stats.height,
        customselectors: this.customselectors[name],
      };
      return this.options.template(data);
    }).then((css) => {
      return css;
    });
  }
}

const PNG_PREFIX = 'data:image/png;base64,';
const SVG_PREFIX = 'data:image/svg+xml;charset=US-ASCII,';
const SVG_XML_PREAMBLE =
  '<?xml version="1.0" encoding="utf-8"?>\n'
  + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"'
  + ' "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
const encoders = {
  png: class PngUriEncoder extends DataUriEncoder {
    constructor(file, options) {
      super(file, options);
    }

    stats() {
      return super.stats();
    }

    encode() {
      const datauri = PNG_PREFIX + super.encode();

      // IE LTE8 cannot handle datauris that are this big. Need to make sure it just
      // links to a file
      if (datauri.length > 32768 || this.options.noencodepng) {
        return path.join(this.options.pngfolder, path.basename(this.path))
          .split( path.sep )
          .join( '/' );
      }

      return datauri;
    }
  },
  svg: class SvgUriEncoder extends DataUriEncoder {
    constructor(file, options) {
      super(file, options);
    }

    stats() {
      return super.stats();
    }

    encode() {
      const contentStr = this.file.contents.toString('utf-8');

      return SVG_PREFIX + encodeURIComponent(
        (contentStr.startsWith('<?xml')
          ? contentStr
          : (SVG_XML_PREAMBLE + contentStr))
          // strip newlines and tabs
          .replace( /[\n\r]/gmi, '' )
          .replace( /\t/gmi, ' ' )
          // strip comments
          .replace(/<\!\-\-(.*(?=\-\->))\-\->/gmi, '')
          // replace
          .replace(/'/gmi, '\\i')
        );
    }
  },
};
