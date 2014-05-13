var chalk = require('chalk');

module.exports = function (message) {
  console.log(chalk.magenta(message));
};
