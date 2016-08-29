import _ from 'lodash';
import path from 'path';

const colorsRE = /(.*)\.colors\-([^\.]+)/i;

function isHex(str) {
  return /^[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(str);
}

function isColorWord(str) {
  const acceptable = [
    'black', 'silver', 'gray', 'white', 'maroon', 'red', 'purple', 'fuchsia', 'green', 'lime',
    'olive', 'yellow', 'navy', 'blue', 'teal', 'aqua', 'aliceblue', 'antiquewhite', 'aqua',
    'aquamarine', 'azure', 'beige', 'bisque', 'black', 'blanchedalmond', 'blue', 'blueviolet',
    'brown', 'burlywood', 'cadetblue', 'chartreuse', 'chocolate', 'coral', 'cornflowerblue',
    'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray',
    'darkgreen', 'darkgrey', 'darkkhaki', 'darkmagenta', 'darkolivegreen', 'darkorange',
    'darkorchid', 'darkred', 'darksalmon', 'darkseagreen', 'darkslateblue', 'darkslategray',
    'darkslategrey', 'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue', 'dimgray',
    'dimgrey', 'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro',
    'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'greenyellow', 'grey', 'honeydew',
    'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen',
    'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan', 'lightgoldenrodyellow', 'lightgray',
    'lightgreen', 'lightgrey', 'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue',
    'lightslategray', 'lightslategrey', 'lightsteelblue', 'lightyellow', 'lime', 'limegreen',
    'linen', 'magenta', 'maroon', 'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple',
    'mediumseagreen', 'mediumslateblue', 'mediumspringgreen', 'mediumturquoise', 'mediumvioletred',
    'midnightblue', 'mintcream', 'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive',
    'olivedrab', 'orange', 'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise',
    'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple',
    'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen',
    'seashell', 'sienna', 'silver', 'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow',
    'springgreen', 'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat',
    'white', 'whitesmoke', 'yellow', 'yellowgreen'];
  return acceptable.indexOf(str) > -1;
}

function buildColorConfig(colorsList) {
  const colorConfig = {};
  _.forEach(colorsList.split('-'), (color, i) => {
    if (isHex(color)) {
      colorConfig[i] = `#${color}`;
    } else if (isColorWord(color)) {
      colorConfig[color] = color;
    }
  });
  return colorConfig;
}

export default class Colorfy {
  constructor(filename, contents) {
    this.filename = filename;
    this.contents = contents;
  }

  colors() {

  }

  // Returns a list of new converted files
  convert() {
    const parsed = path.parse(this.filename);

    const m = parsed.base.match(colorsRE);
    if (!m) {
      return [];
    }
    const baseFilenameWithoutColors = m[1];
    const colorsList = m[2];

    return _.map(buildColorConfig(colorsList), (color, i) => {
      return {
        filename: path.join(baseFilenameWithoutColors + '-' + i + parsed.ext),
        contents: this.contents.replace(
          /(<svg[^>]+>)/im,
          '$1<style type="text/css">circle, ellipse, line, path, polygon, polyline, rect, text'
          + ' { fill: ' + color + ' !important; }</style>'),
      };
    });
  }
}
