var assert = require('assert')
  , commands = require('../lib/commands')
  , _ = require('lodash')

describe('sl-install', function() {
  var installedLocation
    , mockBranches
    , originalInstaller = commands.Installer
    , originalBranchList = commands.branchList
    , originalInfoLogger = commands.logger.info
    , installCalled
    , loadedJSONPath
    , mockPackageJSON = { version: '0.0.0' }
  function MockInstaller(dest) {
    this.destination = installedLocation = dest
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
  function mockRequire(path) {
    loadedJSONPath = path
    return mockPackageJSON
  }
  before(function() {
    commands.branchList = mockBrancList
    commands.Installer = MockInstaller
    commands.JSONReader = mockRequire
    installedLocation = null
    mockBranches = null
    installCalled = null
    loadedJSONPath = null
    commands.logger.info = originalInfoLogger
  })

  describe('install', function() {

    function assertInstalled(expectedNames, actualUrls) {
      var expectedUrls = _.map(expectedNames, function(name) {
        return 'some_repo/' + name + '/BRANCH/' + name + '-LATEST.tgz'
      })
      assert.equal(expectedUrls.toString(), actualUrls.toString())
    }

    it('uses destination to prepare installer', function(done) {
      var installed = 0
        , opts = {repo: 'some_repo/', destination: 'DEST'}
      installCalled = function(installer, url, cb) {
        installed += 1
        setImmediate(cb, null)
      }
      commands.install('MOD', ['BRANCH'], opts, testDesination)
      function testDesination(err) {
        assert.equal(installedLocation, 'DEST/MOD')
        assert.equal(installed, 1)
        done()
      }
    })

    it('uses repo to generate url', function(done) {
      var opts = {repo: 'some_repo/', destination: 'DEST'}
        , installedUrl = null

      installCalled = function(installer, url, cb) {
        installedUrl = url
        setImmediate(cb, null)
      }

      commands.install('MOD', ['BRANCH'], opts, verifyUrl)

      function verifyUrl() {
        assert.equal(installedUrl, 'some_repo/MOD/BRANCH/MOD-LATEST.tgz')
        done()
      }
    })

    it('gets package list from package.json if none given', function(done) {
      var expected = _.keys(require('../package.json').dependencies)
        , opts = {repo: 'some_repo/', destination: 'DEST'}
        , installed = []

      installCalled = function(installer, url, cb) {
        installed.push(url)
        setImmediate(cb, null)
      }

      commands.install(null, ['BRANCH'], opts, verifyInstalled)

      function verifyInstalled() {
        assertInstalled(expected, installed)
        done()
      }
    })

    it('gets package list from package.json if "." is given', function(done) {
      var expected = _.keys(require('../package.json').dependencies)
        , opts = {repo: 'some_repo/', destination: 'DEST'}
        , installed = []
      installCalled = function(installer, url, cb) {
        installed.push(url)
        setImmediate(cb, null)
      }

      commands.install('.', ['BRANCH'], opts, verifyInstalled)

      function verifyInstalled() {
        assertInstalled(expected, installed)
        done()
      }
    })

    it('uses a list of branches if given', function(done) {
      var expected = [ 'R/foo/BRFOO/foo-LATEST.tgz'
                     , 'R/foo/BRBAR/foo-LATEST.tgz']
        , opts = {repo: 'R/', destination: 'DEST'}
        , installed = []

      installCalled = function(installer, url, cb) {
        installed.push(url)
        setImmediate(cb, new Error('try next branch'))
      }

      commands.install('foo', ['BRFOO', 'BRBAR'], opts, verifyInstalled)

      function verifyInstalled() {
        assert.equal(installed.length, expected.length)
        assert.equal(expected.toString(), installed.toString())
        done()
      }
    })

    it('uses git to determine branches if none given', function(done) {
      var expected = [ 'R/foo/BRFOO/foo-LATEST.tgz'
                     , 'R/foo/BRBAR/foo-LATEST.tgz']
        , opts = {repo: 'R/', destination: 'DEST'}
        , installed = []

      mockBranches = ['BRFOO', 'BRBAR']
      installCalled = function(installer, url, cb) {
        installed.push(url)
        setImmediate(cb, new Error('try next branch'))
      }

      commands.install('foo', [], opts, verifyInstalled)

      function verifyInstalled() {
        assert.equal(installed.length, expected.length)
        assert.equal(expected.toString(), installed.toString())
        done()
      }
    })

    it('stops on the first successful install', function(done) {
      var expected = [ 'R/foo/BRFOO/foo-LATEST.tgz' ]
        , opts = {repo: 'R/', destination: 'DEST'}
        , installed = []

      installCalled = function(installer, url, cb) {
        installed.push(url)
        setImmediate(cb, null) // successful install
      }

      commands.install('foo', ['BRFOO', 'BRBAR', 'BRBAZ', 'BRBUZZ', 'BRANCH'],
                       opts, verifyInstalled)

      function verifyInstalled() {
        assert.equal(installed.length, expected.length)
        assert.equal(expected.toString(), installed.toString())
        done()
      }
    })

  })

  describe('branches', function() {

    it('prints a list of branches', function(done) {
      var output = ''
      commands.logger.info = function(msg) {
        output += msg + '\n'
      }
      mockBranches = ['aaaa', 'bbbb', 'cccc']
      commands.branches({}, function() {
        assert.equal(output, 'aaaa\nbbbb\ncccc\n')
        done()
      })
    })

  })
})
