#!/usr/bin/env node

'use strict';

var meow = require('meow');
var getStdin = require('get-stdin');
var chalk = require('chalk');
var Strongroom = require('./');
var cp = require('copy-paste');

var sr = new Strongroom();

var cli = meow({
  help: [
    'Your passwords will be stored in a file called ' + chalk.bold('.strongroom'),
    '',
    'Usage',
    '  $ strongroom <service> <password length> [options] [flags]',
    '',
    'Options',
    '  -d, --directory  Move .strongroom to another directory',
    '  -r, --replace  Replace an existing service\'s password',
    '',
    'Password Flags',
    '  -u, --upper  Upper case characters',
    '  -l, --lower  Lower case characters',
    '  -n, --numbers  Numbers',
    '  -s, --symbols  symbols',
    ''
  ].join('\n')
});

if (process.stdin.isTTY) {

  if ((cli.flags.directory || cli.flags.d) && cli.input) {
    return setNewDirectory(cli.flags);
  }

  if (cli.input.length === 0) {
    return cli.showHelp();
  }

  if (typeof cli.input[0] !== 'string' && !cli.flags) {
    return console.log(chalk.yellow('The filename must be a string!'));
  }

  init(cli.input, cli.flags);
} else {
  getStdin(init);
}

var sr = new Strongroom();


function init(input, flags) {
  var userInput = {
    service: input[0],
    passwordLength: input[1],
    passwordOpts: flags,
    replace: flags.replace || flags.r
  },
  message = clipboardMessage(userInput.service);


  sr.loadFile(sr.configFilePath, function(data) {
    // No .strongroomrc found
    if (!data) {
      return promptConfigPath(userInput);
    }

    data = JSON.parse(data);

    sr.filePath = data.path;

    // Checks for .strongroom in the module's directory
    sr.loadFile(sr.filePath, function(strongroom) {
      if (!strongroom) {
        // Create new .strongroom
        return askUseEncryption(function(secret) {
          createConfig(function() {
            var config = {
              template: null,
              secret: secret
            };
            addServiceEntry(config, userInput);
          });
        });
      }

      if (sr.isEncrypted(strongroom)) {
        return decryptFile(strongroom, userInput, message, function(secret, decryptedStrongroom) {
          var passwords = JSON.parse(decryptedStrongroom);

          getPassword(passwords, userInput, secret, message);
        });
      }

      getPassword(JSON.parse(strongroom), userInput, false, message);
    });

  });

}

function setNewDirectory(flags) {
  var newFilePath = flags.directory || flags.d;

  sr.loadFile(sr.configFilePath, function(configFile) {
    if (!configFile) {
      return sr.createConfigFile(null, 'Configuration file successfully created!', function() {

      });
    }
    var configPath = JSON.parse(configFile).path.replace(/\s/g, '\\ ');

    sr.moveFile(configPath, newFilePath, function() {
      sr.editConfigFile(newFilePath, 'The path was successfully changed!');
    });
  });
}

function copyToClipboard(providerPassword, message) {
  cp.copy(providerPassword, function() {
    console.log(message);
    process.exit(0);
  });
}

function getPassword(passwords, userInput, secret, message, callback) {
  sr.getPassword(passwords, userInput.service, function(providerPassword) {
    var config = {
      template: passwords,
      secret: null
    };

    // Create a new password if there isn't already one for this service
    // or if the user wants to replace the current one
    if (!providerPassword || userInput.replace) {
      if (secret) {
        config.secret = secret;
      }

      addServiceEntry(config, userInput);
      return;
    }

    copyToClipboard(providerPassword, message);
  });
}

function decryptFile(strongroom, userInput, message, callback) {
  sr.promptDecryption('What\'s the secret ?', strongroom, function(err, secret) {
    if (err) {
      console.error(chalk.red('Internal Error'));
      return process.exit(1);
    }

    sr.decrypt(secret, strongroom, function(err, decryptedStrongroom) {
      if (err) {
        console.error(chalk.red('Internal Error'));
        return process.exit(1);
      }

      callback(secret, decryptedStrongroom);
    });
  });
}

function clipboardMessage(service) {
  return [
      chalk.white('The password for ') + chalk.blue(service),
      chalk.white(' is on your ') + chalk.yellow('clipboard!')
  ].join('');
}

function createConfig(cb) {
  sr.createConfigFile(null, cb);
}

function addServiceEntry(config, userInput) {
  var service = userInput.service,
      passwordLength = userInput.passwordLength,
      passwordOpts = userInput.passwordOpts,
      secret = config.secret,
      template = config.template;

  var message = clipboardMessage(service);
  console.log(passwordOpts);
  sr.createServicePassword(template, service, passwordLength, passwordOpts, function(template, providerPassword) {
    if (secret) {
      sr.encrypt(secret, template, function(err, encryptedText) {
        if (err) {
          console.log(chalk.red('Internal Error'), err);
          return process.exit(1);
        }

        persistProvider(encryptedText, providerPassword, userInput, message);
      });
    } else {
      persistProvider(template, providerPassword, userInput, message);
    }
  });
}

function persistProvider(data, providerPassword, userInput, message) {
  sr.writeFile(sr.filePath, message, data, function(err, message) {

    if (err && err.code === 'ENOENT') {
      console.log(chalk.yellow('Cannot create .strongroom at ') + '\n' + sr.filePath);
      return promptConfigPath(userInput);
    }

    if (err) {
      console.log(chalk.red('Internal Error'));
      return process.exit(1);
    }

    copyToClipboard(providerPassword, message);
  });
}

function askUseEncryption(cb) {
  sr.promptSecret(function(err, answer) {
    if (answer) {
      return sr.promptEncryption('Please type the secret', '', function(err, secret) {
        if (err) {
          console.log(chalk.red('Internal Error'));
          return process.exit(1);
        }

        cb(secret);
      });
    }

    cb(null);
  });
}

function promptConfigPath(userInput) {
  return sr.promptLocation(function(err, val) {
    // Write .strongroomrc to the default location
    if (val === 'default') {
      askUseEncryption(function(secret) {
        createConfig(function() {
          var config = {
            template: null,
            secret: secret
          };

          addServiceEntry(config, userInput);
        });
      });
    }

    // write .strongroomrc to a new location
    if (val === 'new') {
      sr.getNewFilePath(function(filePath) {
        sr.filePath = filePath;

        askUseEncryption(function(secret) {
          createConfig(function() {
            var config = {
              template: null,
              secret: secret
            };

            addServiceEntry(config, userInput);
          });
        });
      });
    }
  });
}
