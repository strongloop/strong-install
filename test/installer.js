var assert = require('assert')
  , http   = require('http')

var Installer = require('../lib/installer')

describe('Installer', function() {
  describe('constructor', function () {
    it('sets the installation destination', function () {
      var installer = new Installer('foo')
      assert(installer.destination == 'foo')
    })
    it('behaves like a constructor if called with new', function () {
      var installer = new Installer()
      assert(installer instanceof Installer)
    })
    it('behaves like a factory if called without new', function () {
      var installer = Installer()
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
  })
})
