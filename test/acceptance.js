/*global describe, before, after, it*/
/*jshint expr:true*/

'use strict';

var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var request = require('request');
var async = require('async');
var chalk = require('chalk');
var Promise = require('bluebird');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var testGeneratedProject = require('./helpers/test-generated-project');
var generateProject = require('./helpers/generate-project');
var installDeps = require('./helpers/install-deps');
var say = require('./helpers/say');


var lrPort = 61000;
var serverPort = 62000;

// Helper functions

var booleanCombinations = function (items) {
  var numFeatures = items.length;
  var numCombinations = Math.pow(2, numFeatures);
  var combinations = [];
  var i = 0, j, binary, combo;

  while (i < numCombinations) {
    binary = i.toString(2);
    while (binary.length < items.length) binary = '0' + binary;

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


combinations = combinations.slice(50, 52);


// Filter out combinations that we don't support
combinations = combinations.filter(function (c) {
  return !(c.supportIE8 === true && c.flavour === 'd3');
});
say('Testing ' + combinations.length + ' combinations of options...');


// Set up the output directory structure
var outputDir = path.join(__dirname, 'output');
// rimraf.sync(outputDir); // may disable in dev for speed
mkdirp.sync(path.join(outputDir, 'node_modules'));
mkdirp.sync(path.join(outputDir, 'bower_components'));


// Make some lookup helper hashes
var comboIds = _.map(combinations, function (combo) {
  return JSON.stringify(_.omit(combo, 'spreadsheetId', 'deployBase'))
    .replace(/[\{\}\"]/g, '')
    .replace(/\:/g, '_');
});
var combosHash = _.zipObject(comboIds, combinations);
var comboDirs = _.mapValues(combosHash, function (combo, comboId) {
  return path.resolve(__dirname, 'output', '_' + comboId);
});
// console.log('combosHash', combosHash);
// console.log('comboDirs', comboDirs);


// Run all the generators in parallel
var throat4 = require('throat')(4);
var generatorsRun = _.mapValues(combosHash, function (combo, comboId) {
  return throat4(function () {
    return generateProject(combo, comboDirs[comboId]);
  });
});


// Install deps *one at a time* as soon as any generator is ready
var throat1 = require('throat')(1);
var depsInstalled = _.mapValues(combosHash, function (combo, comboId) {
  return throat1(function () {
    return generatorsRun[comboId].then(function () {

      return installDeps(comboDirs[comboId]);

    });
  });
});


// Whenever a given project's deps have installed, run tests for that project
var testsRun = _.mapValues(combosHash, function (combo, comboId) {

  return new Promise(function (resolve, reject) {

    // console.log('Waiting for depsInstall then running tests for: ', comboId);

    depsInstalled[comboId].then(function () {
      // console.log('\n\n\n\nRUNNING TEST', combo);

      testGeneratedProject(comboDirs[comboId], comboId, combo).then(function (results) {

        // Log all the results
        var failuresToLog = [];
        _.forOwn(results, function (result, description) {
          if (result) {
            failuresToLog.push(chalk.red(description) + '\n' + result.toString());
          }
        });

        if (failuresToLog) {
          console.log(chalk.red('\n\n===========================\nErrors for combo ') + chalk.cyan(comboId));

          failuresToLog.forEach(function (msg) {
            console.log('\n', msg);
          });
        }

        // Indicate this generated project has now been tested
        console.log('This project has now been tested!');
        resolve();
      });
    });
  });
});


// Wait till all tests have run before logging any failures and exiting
Promise.props(testsRun).then(function (allResults) {
  console.log('FINAL THING', allResults);

  var failed;

  _.forOwn(allResults, function (results, comboId) {
    _.forOwn(results, function (failure, description) {

      if (failure) {
        console.error(description, result);
        failed = true;
      }

    });
  });

  var code = failed ? 1 : 0;

  console.log('Exiting with code ' + code);

  process.exit(code);
});
