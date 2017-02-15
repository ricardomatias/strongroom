'use strict';

var fs = require('fs');
var exec = require('child_process').exec;

var chalk = require('chalk');
var promptly = require('promptly');
var lockme = require('lockme');
var magicword = require('magicword');

// File-type: .strongroom
function Strongroom() {
  lockme.call(this);

  this.configFilePath = __dirname + '/.strongroomrc';
  this.filePath = __dirname + '/.strongroom';
  this.template = {
    passwords: []
  };
}

/*
TODO:
- Refactor code to allow callbacks || DECOUPLING
- Allow setting path with a flag (so it points to an existing file ** DROPBOX **)
- Generate a new password on an existing service
- Delete .strongroom
*/


// Setting up inheritance
Strongroom.prototype = Object.create(lockme.prototype);



Strongroom.prototype._setDir = function _setDir() {
  this._getNewFilename(function() {
    return this._createConfig(function() {
      return console.log(this.filePath + ' is the new directory!');
    }.bind(this));
  }.bind(this));
};


Strongroom.prototype.promptLocation = function promptLocation(cb) {
  var question = [
    chalk.green('Should I store ') + chalk.bold.blue('.strongroom ') +
    chalk.green('in the module\'s folder or in a new one?'),
    chalk.white('Write ') + chalk.bold.yellow('default') + ' or ' + chalk.bold.yellow('new'),
    chalk.blue('>')
  ].join('\n');

  promptly.choose(question, [ 'default', 'new' ], function(err, val) {
    if(err) {
      return cb(err);
    }

    cb(null, val);
  });
};


Strongroom.prototype.getNewFilePath = function getNewFilePath(cb) {
  var question = [
    chalk.green('Please write down the absolute path where you want to store ') + chalk.blue('.strongroom') + ':',
    chalk.dim('f.ex: /Users/ricardomatias/Desktop/.strongroom'),
    chalk.blue('>')
  ].join('\n');

  function validator(val) {
    var patt = /^\/(\w|\/|\s)+\/\.strongroom$/;

    if(!patt.test(val)) {
      throw new Error(val);
    }
    return val;
  }

  return promptly.prompt(question, { retry: false, validator: validator }, function(err, filePath) {
    if (err) {
      console.log(chalk.bold.yellow(err.message) + chalk.yellow(' is an invalid absolute path. Try again!'));
      return err.retry();
    }

    return cb(filePath);
  });
};


Strongroom.prototype.createConfigFile = function createConfigFile (err, cb) {
  if (err) {
    console.log(chalk.red('Internal Error'));
    return process.exit(1);
  }

  var config = {
    path: this.filePath
  };

  fs.writeFile(this.configFilePath, JSON.stringify(config), function(err) {
    if (err) {
      console.log(chalk.red('Internal Error'));
      return process.exit(1);
    }

    cb();
  });
};


Strongroom.prototype.loadFile = function loadFile(filename, cb) {
  fs.readFile(filename, { encoding: 'utf8' }, function(err, data) {
    if (err && err.code === 'ENOENT') {
      return cb(null);
    }

    if (err) {
      console.error(chalk.red('Internal Error'));
      return process.exit(1);
    }

    cb(data);
  });
};


Strongroom.prototype.moveFile = function moveFile(oldFilePath, newFilePath, cb) {
  exec('mv ' + oldFilePath + ' ' + newFilePath, function(err, stdout, stderr) {
    if (err || stderr) {
      console.log(stderr);
      console.log(chalk.red('Error - Couldn\'t move .strongroom to the new location'));
      return process.exit(1);
    }

    cb();
  });
};


Strongroom.prototype.editConfigFile = function editConfigFile(newFilePath, message) {
  var config = {
    path: newFilePath
  };

  fs.writeFile(this.configFilePath, JSON.stringify(config), function(err) {
    if (err) {
      console.log(chalk.red('Internal Error'));
      return process.exit(1);
    }

    console.log(chalk.green(message));
  });
};


Strongroom.prototype.promptSecret = function promptSecret(cb) {
  var question = chalk.green('Want to encrypt .strongroom with a secret ?') + chalk.yellow(' (yes/no)');

  promptly.confirm(question, function(err, val) {
    if (err) {
      return cb(err);
    }

    cb(null, val);
  });
};


Strongroom.prototype.createMasterPassword = function createMasterPassword(cb) {
  this.masterPassword = [];

  return this._passwordPrompt('Please type the master password', cb);
};


Strongroom.prototype.createServicePassword =
function createServicePassword(template, service, passwordLength, passwordOpts, cb) {
  var structure = template || this.template,
      providerPassword = magicword(passwordLength, passwordOpts),
      duplicateIdx;

  structure.passwords.forEach(function(elem, idx) {
    if (Object.getOwnPropertyNames(elem)[0] === service) {
      duplicateIdx = idx;
    }
  });

  if (duplicateIdx !== undefined) {
    structure.passwords[duplicateIdx][service] = providerPassword;
  }

  return cb(JSON.stringify(structure), providerPassword);
};


Strongroom.prototype.getPassword = function getPassword(template, service, cb) {
  var pw;

  template.passwords.forEach(function(provider) {
    if (provider[ service ] !== undefined) {
      pw = provider[ service ];
    }
  });

  return cb(pw);
};

module.exports = exports = Strongroom;
