strong-install
==============

Utility for installing Node packages from somewhere other than npmjs.org

## Install
`npm install -g strong-install`
or
```
git clone git@github.com:strongloop/strong-install.git`
cd strong-install
npm link
```

## Run
```
  Usage: sl-install [options] [command]

  Commands:

    install [package] [branches...] install given package or all dependencies
    branches               print a list of branches for resolving dependencies against
    *

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    -r, --repo <url>         Set repository to install from
    -d, --destination <dir>  Set directory to install from
    -q, --quiet              Suppress unimportant output
```
