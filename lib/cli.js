#!/usr/bin/env node

var Installer = require('../lib/installer')
  , git       = require('../lib/git')
  , program   = require('commander')
  , _         = require('lodash')
  , async     = require('async')
  , path      = require('path')
  , util      = require('util')
  , self      = require('../package.json')

exports.run = run
exports.Installer = Installer
exports.branchList = git.branchList

function run(args, env) {
  var packages = []
    , pkgJSON = null
    , cmd
    , install = new program.Command('install')

  env = env || process.env

  install
    .version(self.version)
    .usage('[options] [pkgname] [branch...]')
    .option('-r, --repo <url>',
            'Set repository to install from',
            env.ALT_REPO)
    .option('-d, --destination <dir>',
            'Set directory to install from',
            'node_modules')

  cmd = install.parse(args)

  if (cmd.args.length > 0) {
    packages.push(cmd.args.shift())
  } else {
    pkgJSON = path.join(process.cwd(), 'package.json')
    console.log('No package specified, looking for dependencies in ' + pkgJSON)
    packages = _.keys(require(pkgJSON).dependencies)
  }

  if (packages.length === 0) {
    return cmd.help()
  }

  usingBranches(cmd.args, exports.branchList, function(err, branches) {
    if (err) {
      console.log(err)
    } else {
      installList(packages, branches, cmd.repo, cmd.destination)
    }
  })
}

function usingBranches(list, alternative, callback) {
  if (list.length < 1) {
    alternative(callback)
  } else {
    setImmediate(callback, null, list)
  }
}

function installList(pkgs, branches, repo, destination) {
  console.log('Installing ' + pkgs.join(', '))
  console.log('Candidate branches: ' + branches.join(', '))

  var installations = _.map(pkgs, function(name) {

    var installer = new exports.Installer(path.join(destination, name))

    installer.on('entry', function() { process.stdout.write('.') })

    return {
      name: name,
      install: install,
      branches: _.map(branches, branchAndUrl),
      installed: false
    }

    function branchAndUrl(br) {
      return { name: br, url: pkgUrl(repo, name, br) }
    }

    function install(url, next) {
      installer.install(url, next)
    }

  })

  async.each(installations, doInstall, report)

  function doInstall(installation, nextInstall) {

    async.each(installation.branches, branchInstall, nextInstall)

    function branchInstall(branch, nextBranch) {
      if (installation.installed) { return nextBranch() }
      installation.install(branch.url, function(err) {
        if (!err) {
          installation.installed = branch
          console.log('done.')
        }
        nextBranch()
      })
    }
  }

  function report(err) {
    var failure = false

    _.each(installations, function(installation) {
      if (installation.installed) {
        console.log('Installed ' +
                    installation.name + '@' + installation.installed.name)
      } else {
        failure = true
        console.log('Failed to install ' + installation.name)
      }
    })

    if (failure) {
      process.exit(1)
    }
  }
}

function pkgUrl(repo, name, branch) {
  return repo + name + '/' + branch + '/' + name + '-LATEST.tgz'
}

exports.run = run
