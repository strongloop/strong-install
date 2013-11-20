var exec   = require('child_process').exec
  , assert = require('assert')
  , http   = require('http')
  , fs     = require('fs')
  , _      = require('lodash')

var resolver = require('../lib/resolver')

describe('resolver', function() {
  describe('branchList', function() {
    it('returns an array', function(done) {
      resolver.branchList(function(err, list) {
        assert(Array.isArray(list), err)
        done()
      })
    })
    it('succeeds', function(done) {
      resolver.branchList(function(err, list) {
        assert(!err, err)
        done()
      })
    })
    it('does not contain HEAD', function(done) {
      resolver.branchList(function(err, list) {
        assert(!_.contains(list, 'HEAD'))
        done()
      })
    })
    it('returns a list of all branches related to current HEAD')
  })
})
