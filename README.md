# FT News App Generator [![Build Status](https://secure.travis-ci.org/ft-interactive/generator-ftnewsapp.png?branch=master)](http://travis-ci.org/ft-interactive/generator-ftnewsapp)

Yeoman generator that scaffolds out an FT interactive graphic/news app.

## Installing the generator

    npm install -g generator-ftnewsapp


## How to use

### Generating a new project

1. Ensure you've got the latest versions of everything: `sudo npm install -g yo bower generator-ftnewsapp`

2. Make a new directory and `cd` into it, then run the generator: `yo ftnewsapp`


### Developing

- Run `grunt serve` and start developing.
  - If it fails to run, you might need to install dependencies: `npm install && bower install` (then try `grunt serve` again)

- To install a new component, e.g. Backbone:
  - Run `bower install backbone --save` (which will download it into your `bower_components` folder and make a note of it in `bower.json`)
  - Add a `<script>` tag in your `index.html`, or `@import` something in your `main.scss`, as appropriate
  - If you're not sure what a component's name is, try searching: `bower search backbone`


### Deploying

* Run `grunt build`, which creates an optimised version of your project in `dist`.
* Type `grunt deploy:live` or `grunt deploy:demo`.

You will need an `.igdeploy` file (ideally in your home directory, so it works for all your projects), which should look like this:

```json
{
  "username": "John.Smith",
  "password": "kittens",
  "host": "example.com"
}
```

Check with Callum or Luke what the host should be.

If you deploy something broken by mistake, you can do `grunt undodeploy:live` (or `grunt undodeploy:demo`). This will revert it to the last version. But note you can only do this once; only one history state is saved.


## Options

Flags you can use when running `yo ftnewsapp`:

* `--skip-install`

  Skips the automatic execution of `bower` and `npm` after scaffolding has finished.

* `--test-framework <framework>`

  Defaults to `mocha`. Can be switched for another supported testing framework like `jasmine`.
