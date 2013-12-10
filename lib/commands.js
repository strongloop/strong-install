#!/usr/bin/env node

var Installer = require('../lib/installer')
  , git       = require('../lib/git')
  , _         = require('lodash')
  , async     = require('async')
  , path      = require('path')

// Main exports
exports.install = cmdInstall
exports.branches = cmdBranches

// For dependency injection
exports.logger     = console
exports.Installer  = Installer
exports.branchList = git.branchList

function cmdInstall(pkgName, branches, opts, done) {
  var packages = []
    , pkgJSON = null

  if (pkgName && pkgName != '.') {
    packages.push(pkgName)
  } else {
    pkgJSON = path.join(process.cwd(), 'package.json')
    exports.logger.info('Looking for dependencies in ' + pkgJSON)
    packages = _.keys(require(pkgJSON).dependencies)
  }

  usingBranches(branches, exports.branchList, function(err, branches) {
    if (err) {
      exports.logger.error(err)
      done(err)
    } else {
      installList(packages, branches, opts.repo, opts.destination, done)
    }
  })
}

function cmdBranches(opts, done) {
  exports.branchList( function(err, branches) {
    if (err) {
      exports.logger.error(err)
    } else {
      _.each(branches, function(br) {
        exports.logger.info(br)
      })
    }
    if (done) {
      done()
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

function installList(pkgs, branches, repo, destination, doneInstallList) {
  exports.logger.info('Packages to install: ' + pkgs.join(', '))
  exports.logger.info('Candidate branches: ' + branches.join(', '))

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

    async.eachSeries(installation.branches, branchInstall, nextInstall)

    function branchInstall(branch, nextBranch) {
      if (installation.installed) { return nextBranch() }
      installation.install(branch.url, function(err) {
        if (!err) {
          installation.installed = branch
          exports.logger.info('done. (' + installation.name + '@' + branch.name + ')')
        }
        nextBranch()
      })
    }
  }

  function report(err) {
    var failure = false

    _.each(installations, function(installation) {
      if (installation.installed) {
        exports.logger.info('Installed ' +
                    installation.name + '@' + installation.installed.name)
      } else {
        failure = true
        exports.logger.info('Failed to install ' + installation.name)
      }
    })

    if (failure) {
      doneInstallList(new Error("Failed to install all packages"))
    } else {
      doneInstallList()
    }
  }
}

function pkgUrl(repo, name, branch) {
  return repo + name + '/' + branch + '/' + name + '-LATEST.tgz'
}
