#!/usr/bin/env node

var Installer = require('../lib/installer')
  , git       = require('../lib/git')
  , _         = require('lodash')
  , async     = require('async')
  , path      = require('path')
  , http      = require('http')
  , npm       = require('npm')
  , os        = require('os')
  , fs        = require('fs')

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
    , pkgJSONPath = null

  opts.npmConfig = { loglevel: opts.quiet ? 'silent' : 'http' }

  if (pkgName && pkgName != '.') {
    packages.push(pkgName)
  } else {
    pkgJSONPath = path.resolve(process.cwd(), 'package.json')
    if (!opts.quiet) {
      exports.logger.info('Looking for dependencies in ' + pkgJSONPath)
    }
    packages = packagesFromPackageJSON(pkgJSONPath, true)
  }

  http.globalAgent.maxSockets = 50

  withNpm(function() {
    usingBranches(branches, exports.branchList, function(err, branches) {
      if (err) {
        exports.logger.error(err)
        done(err)
      } else {
        installList(packages, branches, opts, postInstall)
      }
    })
  })

  function withNpm(cb) {
    if (opts.npm) {
      npm.load(opts.npmConfig, function(err, npm) {
        opts.npm = npm
        setImmediate(cb)
      })
    } else {
      setImmediate(cb)
    }
  }

  function postInstall(err) {
    if (opts.npm) {
      exports.logger.info('npm install .')
      opts.npm.install('.', done)
    } else {
      done(err)
    }
  }
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

function packagesFromPackageJSON(path, devDependencies) {
  var pkgJSON = require(path)
    , deps = _.keys(pkgJSON.dependencies || {})
  if (devDependencies) {
    deps = deps.concat(_.keys(pkgJSON.devDependencies || {}))
  }
  return deps
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
    , installations = _.map(pkgs, function(name) { return installationTaskFromName(name, opts.destination) })
    , installationLog = []

  async.each(installations, logInstallResult(doInstall), report)

  function logInstallResult(iter) {
    return function loggedIterator(item, next) {
      iter(item, function(err) {
        installationLog.push(item)
        next(err)
      })
    }
  }

  function installationTaskFromName(name, destination) {
    var installer_path = opts.npm ? path.join(os.tmpdir(), '.sl-cache', name)
                                  : path.join(destination, name)
    var installer = new exports.Installer(installer_path)
      , installation = { name: name
                       , install: install
                       , branches: _.map(branches, branchAndUrl)
                       , installed: false
                       , destination: installer.destination
                       , deps: []
                       }

    if (!opts.quiet) {
      installer.on('entry', function() { process.stderr.write('.') })
    }

    return installation

    function branchAndUrl(br) {
      return { name: br, url: pkgUrl(repo, name, br) }
    }

    function install(url, next) {
      installer.install(url, postInstall(next))
    }

    function postInstall(cb) {
      return function(err) {
        if (err) {
          return cb(err)
        }
        if (opts.recursive) {
          setImmediate(installSubDeps, cb)
        } else if(opts.npm) {
          setImmediate(npmInstall, cb)
        } else {
          setImmediate(cb)
        }
      }
    }

    function installSubDeps(cb) {
      var pkgJSONPath = path.resolve(process.cwd(), path.join(installer.destination, 'package.json'))
        , pkgs = packagesFromPackageJSON(pkgJSONPath, false)
        , subDestination = path.join(installer.destination, 'node_modules')
        , subDeps = _.map(pkgs, function(name) { return installationTaskFromName(name, subDestination) })
      async.waterfall([ function(callback) {
                          async.each(subDeps, doInstall, callback)
                        }
                      , updateVersion
                      ], function(err, result) {
        if (err) {
          return cb(err)
        }
        if (opts.npm) {
          setImmediate(npmInstall, cb)
        } else {
          setImmediate(cb)
        }
      })
      // })
      function updateVersion(callback) {
        var current
        // if (err) { return callback(err) }
        current = require(pkgJSONPath)
        // if (current.version.indexOf('+') < 0) {
        current.version += "+XXXXXXXX"
        console.log(current.name, current.version)
        // } else {
        //   current.version += "XXXXXXXX"
        // }
        fs.writeFile( pkgJSONPath
                    , new Buffer(JSON.stringify(current, null, 2) + "\n")
                    , callback )
      }
    }

    function npmInstall(cb) {
      exports.logger.info('npm install ' + installer.destination + ' -> ' + destination)
      // npm.dir = destination
      opts.npm.commands.install(destination, installer.destination, cb)
      // npm.commands.cache(['add', installer.destination], cb)
    }
  }

  function doInstall(installation, nextInstall) {

    async.eachSeries(installation.branches, branchInstall, nextInstall)

    function branchInstall(branch, nextBranch) {
      if (installation.installed) { return nextBranch() }
      installation.install(branch.url, function(err) {
        var pkgJSON = path.resolve(process.cwd(),
                                   path.join(installation.destination,
                                             'package.json'))
          , description
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

    _.each(installationLog, function(installation) {
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
