#!/usr/bin/env node

var Installer = require('../').Installer
  , program   = require('commander')
  , path      = require('path')
  , _         = require('lodash')

var defaultRepo = process.env.ALT_REPO

var branches
  , pkgName
  , cmd
  , pkg

process.title = 'sl-ci-install'

program
  .version(require('../package.json').version)
  .usage('[options] <pkgname> [branch...]')
  .option('-r, --repo <url>',
          'Set repository to install from',
          defaultRepo)

cmd = program.parse(process.argv)

pkgName = cmd.args.shift()

if (cmd.args.length < 1) {
  branches = ['origin/master', 'origin/production']
} else {
  branches = cmd.args
}

pkg = new Installer( path.join('node_modules', pkgName) )

install(branches)

function install (branches) {
  var branch = branches.shift()
  if (!branch) {
    console.log("Failed to install " + pkgName)
  } else {
    pkg.install(pkgUrl(cmd.repo, pkgName, branch), function(err) {
      if (err) {
        console.log(err)
        setImmediate(_.partial(install, branches))
      } else {
        console.log(pkgName + " was installed to " + pkg.destination)
      }
    })
  }
}

function pkgUrl(repo, name, branch) {
  return repo + name + '/' + branch + '/' + name + '-LATEST.tgz'
}
