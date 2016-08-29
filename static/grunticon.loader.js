/* global window, document, navigator */
window.grunticon = function(css) {
  // expects a css array with 3 items representing CSS paths to datasvg, datapng, urlpng
  if ( !css || css.length !== 3 ) {
    return;
  }

  // Thanks Modernizr & Erik Dahlstrom
  const w = window;
  const svg = (!!w.document.createElementNS
    && !!w.document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect
    && !!document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#Image', '1.1')
    && !(window.opera && navigator.userAgent.indexOf('Chrome') === -1));

  const loadCSS = function(data) {
    const link = w.document.createElement( 'link' );
    const ref = w.document.getElementsByTagName( 'script' )[ 0 ];
    link.rel = 'stylesheet';
    // eslint-disable-next-line no-nested-ternary
    link.href = css[data && svg ? 0 : data ? 1 : 2 ];
    ref.parentNode.insertBefore( link, ref );
  };

  // Thanks Modernizr
  const img = new w.Image();

  img.onerror = function() {
    loadCSS( false );
  };

  img.onload = function() {
    loadCSS( img.width === 1 && img.height === 1 );
  };

  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
};
// Call grunticon() here to load CSS:
