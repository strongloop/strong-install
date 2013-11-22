var exec   = require('child_process').exec
  , assert = require('assert')
  , http   = require('http')
  , fs     = require('fs')
  , _      = require('lodash')

var git = require('../lib/git')

describe('git', function() {
  describe('branchList', function() {
    it('returns an array', function(done) {
      git.branchList(function(err, list) {
        assert(Array.isArray(list), err)
        done()
      })
    })
    it('succeeds', function(done) {
      git.branchList(function(err, list) {
        assert(!err, err)
        done()
      })
    })
    it('does not contain HEAD', function(done) {
      git.branchList(function(err, list) {
        assert(!_.contains(list, 'HEAD'))
        done()
      })
    })
  })

  describe('when mocked', function() {
    var originalGit = _.extend({}, git.git)
    after(function() {
      _.extend(git.git, originalGit)
    })
    describe('branchList', function() {
      it('gives branches related to a commit', function(done) {
        var commit = 'abcdef1234567890'
          , parents = 'cdef1234567890ab def1234567890abc ef1234567890abcd'
          , refs =
                [ 'abcdef1234567890 refs/heads/master'
                , 'bcdef1234567890a refs/remotes/origin/HEAD'
                , 'bcdef1234567890a refs/remotes/origin/master'
                , 'cdef1234567890ab refs/remotes/origin/production'
                , 'def1234567890abc refs/remotes/origin/feature/foo'
                , 'ef1234567890abcd refs/remotes/origin/release/1.0.0'
                ]
          , expected = ['origin/feature/foo', 'origin/master']
        git.git.gitShowRef = function(callback) { callback(null, refs) }
        git.git.currentCommit = function() { return commit }
        git.git.currentBranch = function() { return 'origin/feature/foo' }
        git.git.gitRevList = function(head, callback) { callback(null, [commit].concat(parents)) }
        git.branchList(function(err, branches) {
          assert.deepEqual(branches, expected)
          done()
        })
      })
    })
  })
})
