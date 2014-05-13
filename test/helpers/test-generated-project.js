var Promise = require('bluebird');
var path = require('path');
var exec = require('child_process').exec;
var say = require('./say');

module.exports = function (dir, comboId, combo) {
  return new Promise(function (resolve, reject) {
    var tests = {
      'All JS passes jshint': new Promise(function (resolve, reject) {
        var jshintPath = path.resolve(
          dir, 'node_modules', 'grunt-contrib-jshint',
          'node_modules', '.bin', 'jshint'
        );

        var glob = require('glob');
        glob('app/scripts/*.js', { cwd: dir }, function (err, files) {
          if (err) return reject(err);

          resolve(Promise.all(files.map(function (file) {
            return new Promise(function (resolve, reject) {
              exec(jshintPath + ' ' + path.join(dir, file), function (err, stdout, stderr) {

                var testFailure = null;
                if (err) {
                  testFailure = new Error(stdout);
                }

                resolve(testFailure);
              });
            });
          })));
        });
      })
    };

    // console.log('TESTS', tests);

    Promise.props(tests).then(function (results) {
      // console.log('results', results);
      resolve(results);
    });
  });
};
