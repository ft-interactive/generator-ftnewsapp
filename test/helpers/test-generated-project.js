var Promise = require('bluebird');
var path = require('path');
var request = require('request');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var say = require('./say');
var _ = require('lodash');


module.exports = function (dir, comboId, combo, webPort, lrPort) {
  return new Promise(function (resolve, reject) {

    var tests = {
      /*
        Each 'feature' here takes the form of a promise (which should be rejected with an informative error if the test fails, or resolved with nothing if it passes).
      */

      'All JS passes jshint': new Promise(function (resolve, reject) {
        var jshintPath = path.resolve(
          dir, 'node_modules', 'grunt-contrib-jshint',
          'node_modules', '.bin', 'jshint'
        );

        var glob = require('glob');
        glob('app/scripts/*.js', { cwd: dir }, function (err, files) {
          if (err) return reject(err);

          Promise.all(files.map(function (file) {
            return new Promise(function (resolve, reject) {
              exec(jshintPath + ' ' + path.join(dir, file), function (err, stdout, stderr) {

                var testFailure = null;
                if (err) {
                  testFailure = new Error(stdout);
                }

                resolve(testFailure);
              });
            });
          })).then(function (results) {
            results = _.compact(results);
            resolve(results.length ? results : null);
          });
        });
      }),

      'grunt serve works': new Promise(function (resolve, reject) {
        var gruntFlags = [
          'serve',
          '--stack',
          '--port=' + webPort,
          '--lrport=' + lrPort
        ];
        say('Spawning: ENVIRONMENT=test grunt ' + gruntFlags.join(' '));
        var gruntServe = spawn('grunt', gruntFlags, {
          env: _.assign({}, process.env, {ENVIRONMENT: 'test'}),
          cwd: dir
        });

        var ready;
        gruntServe.stdout.on('data', function (data) {
          // console.log('STDOUT...\n' + data.toString() + '\n...STDOUT');

          if (!ready && data.toString().trim() === 'Waiting...') {
            ready = true;

            // Server is ready for action.
            // Try requesting from it
            function finish(err) {
              gruntServe.on('close', function (code) {
                if (err) reject(err);
                else resolve();
              });
              gruntServe.kill();
            }

            request('http://localhost:' + webPort + '/', function (err, response, body) {
              if (err) return finish(err);

              if (response.statusCode !== 200)
                return finish(new Error('Expected 200 response, got ' + response.statusCode));

              finish();
            });

            // TODO: something more proper
          }
        });
      })
    };

    Promise.props(tests).then(function (results) {
      resolve(results);
    });
  });
};
