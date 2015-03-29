#!/usr/bin/env node

var fs = require('fs');
var chalk = require('chalk');
var promptly = require('promptly');

// File-type: .strongroom (where passwords are stored)

var args = process.argv.slice(2);

if (!args.length) {
  return console.log('help');
} else {
  return init.apply(null, args);
}

// First time using, ask if user wants a general password (find better name)
// strongroom gmail -> first time, creates password
// strongroom gmail -> second time, retrieves password
// strongroom gmail prompts=<password> -> second time, retrieves password

function init(service, password) {
  return !password ? createFile(null) : createFile(true);
}

function createFile(hasPassword) {

}

var password = [];
var picksArray = [];
var unicodes = [
  [65, 90], // upper case
  [97, 122], // lower case
  [48, 57], // numbers
  [35, 38], // symbols set 1
  [58, 63] // symbols set 2
];

// Selects picks while garanteeing 1 upper and 1 lower
function createPicks() {
  for (var i = 0; i < 9; i += 1) {
    if (i > 2) {
      picksArray.push(randomInt(0, 4));
    } else {
      picksArray.push(i);
    }
  }

  // sorts the array randomly
  picksArray.sort(function() {
    return randomInt(0, 1);
  });

  return createPassword();
}

// Picks a random number within a range
function randomInt(min, max) {
  return Math.round(Math.random() * (max - min)) + min;
}

function createPassword() {
  for (var j = 0; j < picksArray.length; j += 1) {
    // Random number from PicksArray, random pick from unicodes, random unicode
    var pick = picksArray[j];
    password.push(String.fromCharCode(randomInt.apply(null, unicodes[pick])));
  }
  return console.log(password.join(''));
}

// createPicks();
