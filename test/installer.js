var exec   = require('child_process').exec
  , assert = require('assert')
  , http   = require('http')
  , fs     = require('fs')

var Installer = require('../lib/installer')

describe('Installer', function() {

  beforeEach(function(done) {
    exec('rm -rf test/tmp', done)
  })

  describe('constructor', function () {
    it('sets the installation destination', function () {
      var installer = new Installer('foo')
      assert(installer.destination == 'foo')
    })
    it('is a constructor', function () {
      var installer = new Installer()
      assert(installer instanceof Installer)
    })
  })

  describe('#install', function () {
    var installer = new Installer('test/tmp')
    it('fails if the url is invalid', function (done) {
      installer.install('http://localhost:1/', function(err) {
        assert(err instanceof Error)
        done()
      })
    })
    it('fails if the package does not exist', function (done) {
      var server = http.createServer()
      .on('request', function (req, res) {
        res.statusCode = 404
        res.end('Not Found')
      })
      .on('listening', function() {
        var url404 = 'http://localhost:' + server.address().port + '/something'
        installer.install(url404, function(err) {
          assert(err instanceof Error)
          server.close(done)
        })
      })
      .listen(0)
    })
    it('installs a tgz from a url', function(done) {
      var server = http.createServer()
      .on('request', function (req, res) {
        res.statusCode = 200
        fs.createReadStream('test/fixtures/sl-install-0.0.0.tgz').pipe(res)
        // res.end('Not Found')
      })
      .on('listening', function() {
        var urltgz = 'http://localhost:' + server.address().port + '/something'
        assert(! fs.existsSync('test/tmp/package.json'))
        installer.install(urltgz, function(err) {
          assert(!err)
          assert(fs.existsSync('test/tmp/package.json'))
          server.close(done)
        })
      })
      .listen(0)
    })
  })

  describe('#fromStream', function() {
    var installer = new Installer('test/tmp')
    it('extracts gzipped tar stream to destination', function (done) {
      var tgz = fs.createReadStream('test/fixtures/sl-install-0.0.0.tgz')
      assert(! fs.existsSync('test/tmp/package.json'))
      installer.fromStream(tgz, function(err) {
        assert(fs.existsSync('test/tmp/package.json'))
        assert.ifError(err)
        done()
      })
    })
  })

  describe('entry event', function() {
    it('emits an event for each file extracted')
  })
})
