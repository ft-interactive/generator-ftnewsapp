'use strict';
var util = require('util');
var path = require('path');
var spawn = require('child_process').spawn;
var yeoman = require('yeoman-generator');
var parseSpreadsheetKey = require('parse-spreadsheet-key');
var moment = require('moment');
var async = require('async');
var chalk = require('chalk');

var AppGenerator = module.exports = function Appgenerator(args, options, config) {
  yeoman.generators.Base.apply(this, arguments);

  this.mainJsFile = '';

  this.on('end', function () {
    var msg = [
      '\n\n\n  ---- ALL DONE! ----\n',
      'You might need to install some of the libraries listed below.\n',
      'For example, to download and install "lodash" and "backbone" run the following command:\n\n',
      '      $ bower install --save lodash backbone\n\n',
      '  * lodash    : A utility library for consistency, customization, performance, and extra features.',
      '  * backbone  : Give your JS App some Backbone with Models, Views, Collections, and Events (requires lodash)',
      '  * isotope   : An exquisite jQuery plugin for magical layouts. Enables filtering, sorting, and dynamic layouts.',
      '\n',
      '...to find more libs run:\n',
      '      $ bower search\n\n'
    ];
    if (this.spreadsheetId) {
      msg.push('Bertha republish URL: http://bertha.ig.ft.com/republish/publish/js/' + this.spreadsheetId + '/basic?d=app.data\n\n');
    }
    console.log(msg.join('\n   '));
  });

  this.banner = chalk.gray(this.readFileAsString(path.join(__dirname, 'BANNER')));

  this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));
};

util.inherits(AppGenerator, yeoman.generators.Base);

AppGenerator.prototype.askFor = function askFor() {
  var generator = this;
  var promptsDone = generator.async();

  console.log(this.banner);

  async.series([

    function typePrompt(done) {
      generator.prompt([{
        type: 'list',
        name: 'projectType',
        message: 'What type of interactive do you want to make?',
        choices: [{
          name: 'Embedded graphic',
          value: 'embedded',
          default: true
        }, {
          name: 'Microsite',
          value: 'microsite'
        }]
      }], function (answers) {
        generator.projectType = answers.projectType;
        done();
      });
    },

    function ieSupportPrompt(done) {
      generator.prompt([{
        type: 'list',
        name: 'supportIE8',
        message: 'Do you need to fully support IE8?',
        choices: [{
          name: 'Yes',
          default: true
        }, {
          name: 'No'
        }]
      }], function (answers) {
        generator.supportIE8 = (answers.supportIE8 === 'Yes');
        done();
      });
    },

    function flavourPrompt(done) {
      var flavourOptions = [{
        name: 'jQuery',
        value: 'jquery',
        default: true
      }, {
        name: 'Vanilla JavaScript (no library)',
        value: 'vanilla'
      }];

      if (!generator.supportIE8) {
        flavourOptions.unshift({
          name: 'D3.js' + chalk.gray(' (IE9+)'),
          value: 'd3'
        });
      }

      generator.prompt([{
        type: 'list',
        name: 'flavour',
        message: 'What library will you be using for AJAX and DOM querying/manipulation?',
        choices: flavourOptions
      }], function (answers) {
        generator.flavour = answers.flavour;
        done();
      });
    },

    function featuresPrompt(done) {
      var choices = [{
          name: 'Bertha',
          value: 'bertha',
          default: false
        }, {
          name: 'Handlebars templates',
          value: 'handlebars',
          default: false
        }, {
          name: 'FT IG furniture',
          value: 'furniture',
          default: false
        }
      ];

      generator.prompt([{
        type: 'checkbox',
        name: 'features',
        message: 'Which features do you need?',
        choices: choices
      }], function (answers) {

        generator.features = {};

        choices.forEach(function (choice) {
          generator.features[choice.value] = (
            answers.features.indexOf(choice.value) !== -1
          );
        });

        generator.includePublisher = (generator.features.bertha && generator.projectType === 'embedded');

        done();
      });
    },

    function spreadsheetIdPrompt(done) {
      if (generator.features.bertha) {
        generator.prompt([{
          type: 'input',
          name: 'spreadsheetId',
          message: 'Bertha: Paste your Google Spreadsheet URL here'
        }], function (answers) {
          var key = 'ENTER_A_SPREADSHEET_ID_HERE';
          if (answers.spreadsheetId) {
            try {
              key = parseSpreadsheetKey(answers.spreadsheetId);
            } catch (e) {
              generator.log('\u001b[31m' + 'Error: ' + e.message + '\u001b[0m');
              spreadsheetIdPrompt(done);
              return;
            }
          }

          generator.spreadsheetId = key;
          done();
        });
      }
      else done();
    },

    function deployBasePrompt(done) {
      var suggested;
      if (generator.projectType === 'microsite') {
        suggested = (
          'sites/' + moment().format('YYYY') + '/' +
          path.basename(process.cwd())
        );
      }
      else {
        suggested = (
          'features/' + moment().format('YYYY-MM-DD') + '_' +
          path.basename(process.cwd())
        );
      }

      generator.prompt([{
        type: 'input',
        name: 'deployBase',
        message: 'Where do you want to deploy this project?',
        default: suggested
      }], function (answers) {
        generator.deployBase = answers.deployBase;
        done();
      });
    }

  ], promptsDone);
};

AppGenerator.prototype.gruntfile = function gruntfile() {
  this.template('Gruntfile.js');
};

AppGenerator.prototype.packageJSON = function packageJSON() {
  this.template('_package.json', 'package.json');
};

AppGenerator.prototype.git = function git() {
  this.copy('gitignore', '.gitignore');
  this.copy('gitattributes', '.gitattributes');
};

AppGenerator.prototype.bower = function bower() {
  this.copy('_bower.json', 'bower.json');
};

AppGenerator.prototype.jshint = function jshint() {
  this.template('jshintrc', '.jshintrc');
};

AppGenerator.prototype.editorConfig = function editorConfig() {
  this.copy('editorconfig', '.editorconfig');
};

AppGenerator.prototype.h5bp = function h5bp() {
  this.copy('htaccess', 'app/.htaccess');
};

AppGenerator.prototype.mainStylesheet = function mainStylesheet() {
  this.copy('_var.scss', 'app/styles/_var.scss');
  this.template('main.scss', 'app/styles/main.scss');
};

AppGenerator.prototype.writeIndex = function writeIndex() {
  // prepare default content text
  var defaults = [];
  var contentText = [];

  this.indexFile = this.readFileAsString(path.join(this.sourceRoot(), 'index.html'));
  this.indexFile = this.engine(this.indexFile, this);

  var scripts = [
    'bower_components/ig-fill/fill.js'
  ];

  if (this.flavour !== 'jquery') {
    scripts.push('bower_components/dom-ready/' + this.supportIE8 ? 'legacy.js' : 'dom-ready.js');
  }

  scripts.push('scripts/main-bundle.js');

  this.indexFile = this.appendFiles(this.indexFile, 'js', 'scripts/bottom.js', scripts, null, ['.tmp', 'app', '.']);

  var indent = '        ';

  this.mainJsFile = this.readFileAsString(path.join(this.sourceRoot(), 'main.js'));

  // insert Apache SSI tag as the last item in the head element
  this.indexFile = this.append(this.indexFile, 'head', '\n' + indent + '<!--#include virtual="/inc/extras-head-2.html" -->\n    ');

  // insert last Apache SSI tag after scripts
  this.indexFile = this.append(this.indexFile, 'body', indent + '<!--#include virtual="/inc/extras-foot-2.html" -->\n    ');

  var bodyClasses = [];

  if (this.features.bertha) {
    // this is the simplest way to include the body classes
    bodyClasses.push('invisible');
  }

  if (bodyClasses.length) {
    this.indexFile = this.indexFile.replace('<body>',  '<body class="' + bodyClasses.join(' ') + '">');
  }
};

AppGenerator.prototype.app = function app() {
  this.mkdir('app');

  if (this.features.handlebars) {
    this.mkdir('app/templates');
    this.copy('main.hbs', 'app/templates/main.hbs');
  }

  this.mkdir('app/scripts');
  this.mkdir('app/scripts/vendor');
  this.mkdir('app/styles');
  this.mkdir('app/styles/fonts');
  this.mkdir('app/images');
  this.mkdir('app/images/content');
  this.write('app/index.html', this.indexFile);

  if (this.includePublisher) {
    this.copy('publish.html', 'app/publish.html');
  } else {
    this.copy('no-publish.html', 'app/publish.html');
  }

  this.mkdir('artwork');

  this.template('main.js', 'app/scripts/main.js');
  this.template('modernizr.js', 'app/scripts/vendor/modernizr.js');
};

AppGenerator.prototype.install = function () {
  if (this.options['skip-install']) {
    return;
  }

  var done = this.async();
  this.installDependencies({
    skipMessage: this.options['skip-install-message'],
    skipInstall: this.options['skip-install'],
    callback: done
  });
};
