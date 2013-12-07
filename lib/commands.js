#!/usr/bin/env node

var Installer = require('../lib/installer')
  , git       = require('../lib/git')
  , commander = require('commander')
  , _         = require('lodash')
  , async     = require('async')
  , path      = require('path')
  , util      = require('util')
  , self      = require('../package.json')
  , logger    = console

exports.install = cmdInstall
exports.branches = cmdBranches

exports.Installer = Installer
exports.branchList = git.branchList

function cmdInstall(pkgName, branches, opts) {
  var packages = []
    , pkgJSON = null

  if (pkgName && pkgName != '.') {
    packages.push(pkgName)
  } else {
    pkgJSON = path.join(process.cwd(), 'package.json')
    logger.info('No package specified, looking for dependencies in ' + pkgJSON)
    packages = _.keys(require(pkgJSON).dependencies)
  }

  usingBranches(branches, exports.branchList, function(err, branches) {
    if (err) {
      logger.error(err)
    } else {
      installList(packages, branches, opts.repo, opts.destination)
    }
  })
}

function cmdBranches() {
  exports.branchList( function(err, branches) {
    if (err) {
      logger.error(err)
    } else {
      _.each(branches, function(br) {
        logger.info(br)
      })
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
  logger.info('Installing ' + pkgs.join(', '))
  logger.info('Candidate branches: ' + branches.join(', '))

  var installations = _.map(pkgs, function(name) {

    var installer = new exports.Installer(path.join(destination, name))

    installer.on('entry', function() { process.stderr.write('.') })

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
          logger.info('done.')
        }
        nextBranch()
      })
    }
  }

  function report(err) {
    var failure = false

    _.each(installations, function(installation) {
      if (installation.installed) {
        logger.info('Installed ' +
                    installation.name + '@' + installation.installed.name)
      } else {
        failure = true
        logger.info('Failed to install ' + installation.name)
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

// exports.run = run
