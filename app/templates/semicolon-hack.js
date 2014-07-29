/*
  temporary hack...

  domready doesn't end with a semicolon, so when it concats onto main-bundle.js, it breaks. This script is just a semicolon to go after domready.

  This could be seen as a problem with domready (and it is), but there might many other libraries like this, so really this should be handled by usemin by adding semicolons between joined scripts (and the unnecessary ones would then be removed by uglify anyway). Issue for this: https://github.com/yeoman/grunt-usemin/issues/312

  It is possible to add a concat option, "separator", to fix this now, but this doesn't differentiate between scripts and styles, and an extra semicolon in a stylesheet is a syntax error.
*/

;
