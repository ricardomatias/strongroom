# strongroom [![Build Status](https://travis-ci.org/ricardomatias/strongroom.svg)](https://travis-ci.org/ricardomatias/strongroom)

> Simple & safe password manager (CLI)
>

## Requirements

* node.js

## CLI

```
npm install -g strongroom
```

```cli
  > strongroom gmail
  Should I store .strongroom in the module's folder or in a new one?
  Write default or new
  > new
  Please write down the absolute path where you want to store .strongroom:
  f.ex: /Users/ricardomatias/Desktop/.strongroom
  > /home/ricardo/.strongroom
  Want to encrypt .strongroom with a secret ? (yes/no) y
  Please type the secret
  > (hidden)
  Please confirm the secret
  > (hidden)
  Config file created!
  The password for gmail is on your clipboard!
```

## Usage

```
npm install strongroom
```

```
var Lockme = require('lockme');
var lm = new Lockme({ token: '\u2603', encoding: 'base64' });

lm.decrypt('foo', 'hello world!', function(err, decryptedText) {
    if(err) {
        // do something
    }

    console.log(decryptedText); // 'hello world'
});

```

## API

The encryption is done with the use of a special *Unicode* character to identify that the text was encrypted with **lockme**.

This character is assigned to the **token** property, so you can change it to another character.

The **decrypt** method expects exactly **one** character, so it will throw an error in case this changes.

### new Lockme(opts)
opts.token => the token to encrypt the file with
opts.encoding => what is the string encoding used to encrypt the file

### encrypt (secret, text, callback)

Encrypts the **text** with the given **secret**.

returns => error, encrypted text (String)

---

### decrypt (secret, string, callback)

Decrypts the **text** with the given **secret**.

returns => error, decrypted text (String)

---


### promptEncryption (message, text, callback)

Asks the user to write the secret to **encrypt** the file.

returns => error, secret (String)

---

### promptDecryption(message, text, callback)

Asks the user to write the secret to **decrypt** the file.
Uses `decrypt` to verify the secret.

returns => error, secret (String)

---

### isEncrypted(text)

Checks if the **file** is encrypted (by looking for the token).

returns => Boolean


## License

MIT © Ricardo Matias
