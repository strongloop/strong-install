var assert = require('assert')

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
})
