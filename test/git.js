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
      describe('when HEAD is a merge commit', function() {
        it('gives merged branches', function(done) {
          var refs =
                  [ 'abcdef1234567890 refs/heads/master'
                  , 'bcdef1234567890a refs/remotes/origin/HEAD'
                  , 'bcdef1234567890a refs/remotes/origin/master'
                  , 'cdef1234567890ab refs/remotes/origin/production'
                  , 'def1234567890abc refs/remotes/origin/feature/foo'
                  , 'ef1234567890abcd refs/remotes/origin/release/1.0.0'
                  ]
              // HEAD is a merge of origin/feature/foo into origin/master
            , commits = ['abcdef1234567890', 'bcdef1234567890a', 'def1234567890abc']
            , expected = ['origin/feature/foo', 'origin/master']
          git.git.gitShowRef = function(callback) { callback(null, refs) }
          git.git.currentCommit = function() { return commits[0] }
          git.git.currentBranch = function() { return 'HEAD' }
          git.git.gitRevList = function(head, callback) { callback(null, commits) }
          git.branchList(function(err, branches) {
            assert.deepEqual(branches, expected)
            done()
          })
        })
      })

      describe('when HEAD is not a merge', function() {
        it('gives parent branch of single commit branch', function(done) {
          var commit = 'def1234567890abc'
            , parents = ['bcdef1234567890a']
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

        it('gives parent branch of multiple commit branch', function(done) {
          var commit = 'def1234567890abc'
            , parents = ['f01234567890abcde']
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
})
