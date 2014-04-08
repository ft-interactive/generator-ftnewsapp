/*global describe, before, after, it*/
/*jshint expr:true*/

'use strict';

var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var spawn = require('child_process').spawn;
var _ = require('lodash');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var chalk = require('chalk');
var request = require('request');
var expect = require('chai').expect;


// Helper functions
var say = function (message) {
  console.log(chalk.magenta(message));
};

var booleanCombinations = function (items) {
  var numFeatures = items.length;
  var numCombinations = Math.pow(2, numFeatures);
  var combinations = [];
  var i = 0, j, binary, combo;

  while (i < numCombinations) {
    binary = i.toString(2);
    while (binary.length < items.length) {
      binary = '0' + binary;
    }
    combo = {};
    j = 0;
    while (j < numFeatures) {
      combo[items[j]] = binary[j] === '1';
      j++;
    }
    combinations.push(combo);
    i++;
  }

  return combinations;
};

var md5 = function (str) {
  var hash = crypto.createHash('md5');
  hash.update(str, 'utf8');
  return hash.digest('hex');
};


// Establish all combinations of options
var options = {
  projectType: ['embedded', 'microsite'],
  supportIE8: [true, false],
  flavour: ['vanilla', 'd3', 'jquery'],
  features: booleanCombinations(['bertha', 'handlebars', 'furniture'])
};

var combinations = [];
options.projectType.forEach(function (projectType) {
  options.supportIE8.forEach(function (supportIE8) {
    options.flavour.forEach(function (flavour) {
      options.features.forEach(function (features) {
        combinations.push({
          projectType: projectType,
          supportIE8: supportIE8,
          flavour: flavour,
          features: features,

          spreadsheetId: '0Ajt08GcPGJRbdGV2LWRBSE1kM28wdU41OFkwOG9hSnc',
          deployBase: '_other/ftnewsapp-test'
        });
      });
    });
  });
});


// Filter out impossible combinations
combinations = combinations.filter(function (c) {
  return !(c.supportIE8 === true && c.flavour === 'd3');
});
say('Testing ' + combinations.length + ' combinations of options...');


// Set up the output directory structure
var outputDir = path.join(__dirname, 'output');
mkdirp.sync(path.join(outputDir, 'node_modules'));
mkdirp.sync(path.join(outputDir, 'bower_components'));


// Make a describe block for each option
combinations.forEach(function (combo, i) {
  var comboId = md5(JSON.stringify(combo));
  var comboDir = path.join(outputDir, '_' + comboId);

  describe('Combination #' + i + ' "' + comboId + '"', function () {
    var exitCode;

    before(function (done) {
      this.timeout(false);

      // Create/empty and change into the combo directory
      rimraf.sync(comboDir);
      mkdirp.sync(comboDir);
      process.chdir(comboDir);

      // Write the options to a file, for debugging
      fs.writeFileSync('answers.json', JSON.stringify(combo, null, 2));

      // Symlink node_modules and bower_components into parent
      ['node_modules', 'bower_components'].forEach(function (dir) {
        fs.symlinkSync(path.join('..', dir), dir);
      });

      // Run the generator for this combo
      var yoFlags = [
        'ftnewsapp',
        '--no-insight',
        '--answers=' + JSON.stringify(combo)
      ];
      say('Spawning: yo ' + yoFlags.join(' '));
      var yo = spawn('yo', yoFlags, {/*stdio: 'inherit'*/});

      var counter = 1;
      var interval = setInterval(function () {
        say('...yo has been running for ' + (counter++) + ' minutes...');
      }, 60 * 1000);

      yo.on('error', function (err) {
        console.error('yo error', comboId, err);
        throw err;
      });
      yo.on('close', function (code) {
        exitCode = code;

        clearInterval(interval);
        say('yo exited with code ' + code);

        done();
      });
    });


    it('yo runs and exits without error', function () {
      expect(exitCode).to.equal(0);
    });

    it('No JSHint errors in any generated scripts, including Gruntfile');

    describe('grunt serve', function () {
      // Start up grunt serve and phantom
      var gruntServe;
      before(function (done) {
        this.timeout(30000);

        var gruntFlags = ['serve', '--stack'];
        say('Spawning: ENVIRONMENT=test grunt ' + gruntFlags.join(' '));
        gruntServe = spawn('grunt', gruntFlags, {
          env: _.assign({}, process.env, {ENVIRONMENT: 'test'})
        });

        var ready;
        gruntServe.stdout.on('data', function (data) {
          // console.log('STDOUT...\n' + data.toString() + '\n...STDOUT');

          if (!ready && data.toString().trim() === 'Waiting...') {
            ready = true;
            done();
          }
        });
      });


      it('serves over port 9000', function (done) {
        this.timeout(5000);

        request('http://localhost:9000/', function (err, response, body) {
          expect(response.statusCode).to.equal(200);
          done();
        });
      });

      // TODO with Phantom
      it('Page has no JavaScript or download errors out-of-the-box');
      it('Editing scripts/main.js causes a LiveReload, and the edit works'); // append a console.log, then check it logs


      // Quit grunt serve afterwards
      after(function (done) {
        gruntServe.on('close', function (code) {
          say('grunt exited with code ' + code);
          done();
        });

        gruntServe.kill();
      });
    });

  });
});
