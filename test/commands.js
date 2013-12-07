var assert = require('assert')
  , commands = require('../lib/commands')
  , _ = require('lodash')

commands.logger = {
  log: console.error,
  error: console.error,
  info: console.error
}

describe('sl-install', function() {
  var mock_dest
    , mock_branches
    , original_Installer = commands.Installer
    , original_branchList = commands.branchList
    , install_called
  function MockInstaller(dest) {
    mock_dest = dest
  }
  MockInstaller.prototype.install = function(url) {
    install_called(this, url)
  }
  MockInstaller.prototype.on = function(event) {
    //nothing...
  }
  function mockBrancList(cb) {
    process.nextTick(function() { cb(null, mock_branches) })
  }
  before(function() {
    commands.branchList = mockBrancList
    commands.Installer = MockInstaller
    mock_dest = null
    mock_branches = null
    installCalled = null
  })
  after(function() {
    commands.branchList = original_branchList
    commands.Installer = original_Installer
    mock_dest = null
    mock_branches = null
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
        assert.equal(mock_dest, "DEST/MOD")
        done()
      }
      commands.install('MOD', ['BRANCH'],
                       {repo: 'some_repo/', destination: 'DEST'})
    })

    it('uses repo to generate url', function(done) {
      installCalled = function(installer, url) {
        assert.equal(url, "some_repo/MOD/BRANCH/MOD-LATEST.tgz")
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

  })

  describe('branches', function() {

    it('prints a list of branches', function(done) {
      var output = ""
      commands.logger.info = function(msg) {
        output += msg + '\n'
      }
      mock_branches = ['aaaa', 'bbbb', 'cccc']
      commands.branches(function() {
        assert.equal(output, 'aaaa\nbbbb\ncccc\n')
        done()
      })
    })

  })
})
