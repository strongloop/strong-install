var assert = require('assert')
  , commands = require('../lib/commands')
  , _ = require('lodash')

commands.logger = {
  log: console.error,
  error: console.error,
  info: console.error
}

describe('sl-install', function() {
  var mockDestination
    , mockBranches
    , originalInstaller = commands.Installer
    , originalBranchList = commands.branchList
    , installCalled
  function MockInstaller(dest) {
    mockDestination = dest
  }
  MockInstaller.prototype.install = function(url, cb) {
    installCalled(this, url, cb)
  }
  MockInstaller.prototype.on = function(event) {
    //nothing...
  }
  function mockBrancList(cb) {
    process.nextTick(function() { cb(null, mockBranches) })
  }
  before(function() {
    commands.branchList = mockBrancList
    commands.Installer = MockInstaller
    mockDestination = null
    mockBranches = null
    installCalled = null
  })
  after(function() {
    commands.branchList = originalBranchList
    commands.Installer = originalInstaller
    mockDestination = null
    mockBranches = null
    installCalled = null
  })

  describe('install', function() {

    function assertInstalled(expectedNames, actualUrls) {
      var expectedUrls = _.map(expectedNames, function(name) {
        return 'some_repo/' + name + '/BRANCH/' + name + '-LATEST.tgz'
      })
      assert.equal(expectedUrls.toString(), actualUrls.toString())
    }

    it('uses destination to prepare installer', function(done) {
      installCalled = function(installer, url) {
        assert.equal(mockDestination, 'DEST/MOD')
        done()
      }
      commands.install('MOD', ['BRANCH'],
                       {repo: 'some_repo/', destination: 'DEST'})
    })

    it('uses repo to generate url', function(done) {
      installCalled = function(installer, url) {
        assert.equal(url, 'some_repo/MOD/BRANCH/MOD-LATEST.tgz')
        done()
      }
      commands.install('MOD', ['BRANCH'],
                       {repo: 'some_repo/', destination: 'DEST'})
    })

    it('gets package list from package.json if none given', function(done) {
      var expected = _.keys(require('../package.json').dependencies)
        , installed = []
      installCalled = function(installer, url, cb) {
        installed.push(url)
        cb(null)
        if (installed.length === expected.length) {
          assertInstalled(expected, installed)
          done()
        }
      }
      commands.install(null, ['BRANCH'],
                       {repo: 'some_repo/', destination: 'DEST'})
    })

    it('gets package list from package.json if "." is given', function(done) {
      var expected = _.keys(require('../package.json').dependencies)
        , installed = []
      installCalled = function(installer, url, cb) {
        installed.push(url)
        cb(null)
        if (installed.length === expected.length) {
          assertInstalled(expected, installed)
          done()
        }
      }
      commands.install('.', ['BRANCH'],
                       {repo: 'some_repo/', destination: 'DEST'})
    })

    it('uses a list of branches if given', function(done) {
      var expected = [ 'R/foo/BRFOO/foo-LATEST.tgz'
                     , 'R/foo/BRBAR/foo-LATEST.tgz']
        , installed = []
      installCalled = function(installer, url, cb) {
        installed.push(url)
        if (installed.length === 1) {
          cb(true)
        } else {
          cb(null)
        }
        if (installed.length === expected.length) {
          assert.equal(expected.toString(), installed.toString())
          done()
        }
      }
      commands.install('foo', ['BRFOO', 'BRBAR'],
                       {repo: 'R/', destination: 'DEST'})
    })

    it('uses git to determine branches if none given', function(done) {
      var expected = [ 'R/foo/BRFOO/foo-LATEST.tgz'
                     , 'R/foo/BRBAR/foo-LATEST.tgz']
        , installed = []
      installCalled = function(installer, url, cb) {
        installed.push(url)
        if (installed.length === 1) {
          cb(true)
        } else {
          cb(null)
        }
        if (installed.length === expected.length) {
          assert.equal(expected.toString(), installed.toString())
          done()
        }
      }
      mockBranches = ['BRFOO', 'BRBAR']
      commands.install('foo', [],
                       {repo: 'R/', destination: 'DEST'})
    })

  })

  describe('branches', function() {

    it('prints a list of branches', function(done) {
      var output = ''
      commands.logger.info = function(msg) {
        output += msg + '\n'
      }
      mockBranches = ['aaaa', 'bbbb', 'cccc']
      commands.branches(function() {
        assert.equal(output, 'aaaa\nbbbb\ncccc\n')
        done()
      })
    })

  })
})
