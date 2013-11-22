#!/usr/bin/env node

var slInstall = require('../')
  , program   = require('commander')
  , path      = require('path')
  , util      = require('util')
  , _         = require('lodash')

var pkgName
  , cmd
  , pkg

function run(args, env) {
  program
    .version(require('../package.json').version)
    .usage('[options] <pkgname> [branch...]')
    .option('-r, --repo <url>',
            'Set repository to install from',
            env.ALT_REPO)
    .option('-d, --destination <dir>',
            'Set directory to install from',
            'node_modules')

  cmd = program.parse(args)

  pkgName = cmd.args.shift()

  if (!pkgName) {
    return program.help();
  }

  pkg = new slInstall.Installer( path.join(cmd.destination, pkgName) )

  pkg.on('entry', function() { util.print('.') })

  if (cmd.args.length < 1) {
    slInstall.git.branchList(function(err, branches) {
      if (err) {
        console.log(err)
      } else {
        console.log('Candidate branches: ' + branches.join(', '))
        install(branches)
      }
    })
  } else {
    install(cmd.args)
  }
}

function install (branches) {
  var branch = branches.shift()
  if (!branch) {
    console.log('Failed to install ' + pkgName)
    process.exit(1)
  } else {
    console.log('Installing ' + pkgName + '@' + branch)
    pkg.install(pkgUrl(cmd.repo, pkgName, branch), function(err) {
      if (err) {
        console.log('Failed to install ' + pkgName + '@' + branch)
        _.defer(install, branches)
      } else {
        console.log('\nInstalled ' + pkgName + '@' + branch + ' to ' + pkg.destination)
      }
    })
  }
}

function pkgUrl(repo, name, branch) {
  return repo + name + '/' + branch + '/' + name + '-LATEST.tgz'
}

exports.run = run
