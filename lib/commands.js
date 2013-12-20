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
exports.JSONReader = require

function cmdInstall(pkgName, branches, opts, done) {
  var packages = []
    , pkgJSON = null

  if (pkgName && pkgName != '.') {
    packages.push(pkgName)
  } else {
    pkgJSON = path.join(process.cwd(), 'package.json')
    if (!opts.quiet) {
      exports.logger.info('Looking for dependencies in ' + pkgJSON)
    }
    packages = _.keys(require(pkgJSON).dependencies)
  }

  usingBranches(branches, exports.branchList, function(err, branches) {
    if (err) {
      exports.logger.error(err)
      done(err)
    } else {
      installList(packages, branches, opts, done)
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

function installList(pkgs, branches, opts, doneInstallList) {
  if (!opts.quiet) {
    exports.logger.info('Packages to install: ' + pkgs.join(', '))
    exports.logger.info('Candidate branches: ' + branches.join(', '))
  }

  var repo = opts.repo
    , destination = opts.destination
    , installations = _.map(pkgs, function(name) {

    var installer = new exports.Installer(path.join(destination, name))

    if (!opts.quiet) {
      installer.on('entry', function() { process.stderr.write('.') })
    }

    return {
      name: name,
      install: install,
      branches: _.map(branches, branchAndUrl),
      installed: false,
      destination: installer.destination
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
        var pkgJSON = path.join(process.cwd(),
                                 installation.destination,
                                 'package.json')
          , descriptoin
          , pkg
        if (!err) {
          pkg = exports.JSONReader(pkgJSON)
          installation.installed = { package: pkg, branch: branch }
          description = installation.name + '@' + pkg.version +
                                            ' from ' + branch.name
          if (opts.quiet) {
            exports.logger.info('Installed: ' + description)
          } else {
            exports.logger.info('done. (' + description + ')')
          }
        }
        nextBranch()
      })
    }
  }

  function report(err) {
    var failure = false

    _.each(installations, function(installation) {
      failure = failure || !installation.installed

      if (!opts.quiet) {
        if (installation.installed) {
          exports.logger.info('Installed ' + installation.name +
                              '@' + installation.installed.package.version +
                              ' from ' + installation.installed.branch.name)
        } else {
          exports.logger.info('Package ' + installation.name +
                              ' not found in repo ' + repo)
        }
      }
    })

    if (failure) {
      doneInstallList(new Error('Not all packages found in repo'))
    } else {
      doneInstallList()
    }
  }
}

function pkgUrl(repo, name, branch) {
  return repo + name + '/' + branch + '/' + name + '-LATEST.tgz'
}
