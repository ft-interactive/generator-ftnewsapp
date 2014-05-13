var Promise = require('bluebird');
var rimraf = require('rimraf');
var spawn = require('child_process').spawn;
var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');
var say = require('./say');



module.exports = function (combo, dir) {
  return new Promise(function (resolve, reject) {
      // Create/empty the target directory
      rimraf.sync(dir);
      mkdirp.sync(dir);

      // Write the options to a file, for debugging
      fs.writeFileSync(path.join(dir, 'answers.json'), JSON.stringify(combo, null, 2));

      // Symlink node_modules and bower_components into parent
      ['node_modules', 'bower_components'].forEach(function (packageDir) {
        fs.symlinkSync(
          path.resolve(dir, '..', packageDir),
          path.resolve(dir, packageDir)
        );
      });

      // Run the generator for this combo
      var yoFlags = [
        'ftnewsapp',
        '--no-insight',
        '--skip-install',
        '--answers=' + JSON.stringify(combo)
      ];
      say('Spawning: yo ' + yoFlags.join(' '));
      var yo = spawn('yo', yoFlags, {
        // stdio: 'inherit',
        cwd: dir
      });

      yo.on('error', function (err) {
        console.error('yo error', dir, err);
        throw err;
      });
      yo.on('close', function (code) {
        say('yo exited with code ' + code);

        resolve();
      });
  });
};
