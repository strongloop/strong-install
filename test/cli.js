var assert = require('assert')
  , cli = require('../lib/cli')

describe('sl-install', function() {
  var mock_dest
    , mock_branches
    , original_Installer = cli.Installer
    , original_branchList = cli.branchList
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
    process.nextTick(cb, mock_branches)
  }
  before(function() {
    cli.branchList = mockBrancList
    cli.Installer = MockInstaller
    mock_dest = null
    mock_branches = null
    install_called = null
  })
  after(function() {
    cli.branchList = original_branchList
    cli.Installer = original_Installer
    mock_dest = null
    mock_branches = null
    install_called = null
  })

  it('uses -d/--destination to specify where to install a module', function(done) {
    install_called = function(installer, url) {
      assert.equal(mock_dest, "some_dir/some_module")
      done()
    }
    cli.run(["node", "some_script", "-d", "some_dir", "some_module", "some/branch"])
  })
  it('uses -r/--repo to specify where to install a module', function(done) {
    install_called = function(installer, url) {
      assert.equal(url, "some_repo/some_module/some/branch/some_module-LATEST.tgz")
      done()
    }
    cli.run(["node", "some_script", "-r", "some_repo/", "some_module", "some/branch"])
  })
  it('requires a package name as an argument')
  it('accepts branch names as additional arguments')
})
