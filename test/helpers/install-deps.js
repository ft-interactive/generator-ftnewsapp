var Promise = require('bluebird');
var rimraf = require('rimraf');
var spawn = require('child_process').spawn;
var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');
var async = require('async');

var say = require('./say');

module.exports = function (dir) {
  return new Promise(function (resolve, reject) {
    async.parallel([

      function (done) {
        say('Spawning `npm install` at ' + path.basename(dir));

        var npmInstall = spawn('npm', ['install'], {
          // stdio: 'inherit',
          cwd: dir
        });

        npmInstall.on('error', function (err) {
          console.error('npmInstall error', dir, err);
          done(err);
        });

        npmInstall.on('close', function (code) {
          say('npmInstall exited with code ' + code);
          if (code === 0) done();
          else done(new Error('npm install exited with code ' + code + ' in dir ' + dir));
        });
      },

      function (done) {
        say('Spawning `bower install` at ' + path.basename(dir));

        var bowerInstall = spawn('bower', ['install'], {
          // stdio: 'inherit',
          cwd: dir
        });

        bowerInstall.on('error', function (err) {
          console.error('bowerInstall error', dir, err);
          done(err);
        });

        bowerInstall.on('close', function (code) {
          say('bowerInstall exited with code ' + code);
          if (code === 0) done();
          else done(new Error('bower install exited with code ' + code + ' in dir ' + dir));
        });
      }

    ], function (err) {
      if (err) reject(err);
      else resolve();
    });

  });
};
