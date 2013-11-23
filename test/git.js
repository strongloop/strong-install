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

  describe('mocked git', function() {
    var originalGit = _.extend({}, git.git)
      , refs =
            [ 'abcdef1234567890 refs/heads/master'
            , 'bcdef1234567890a refs/remotes/origin/HEAD'
            , 'bcdef1234567890a refs/remotes/origin/master'
            , 'cdef1234567890ab refs/remotes/origin/production'
            , 'def1234567890abc refs/remotes/origin/feature/foo'
            , 'ef1234567890abcd refs/remotes/origin/release/1.0.0'
            ]
      , children = []
      , parents = []
      , branchMap = {}

    beforeEach(function() {
      git.git.gitShowRef = function(callback) { callback(null, refs) }
      git.git.gitBranch = function(args, callback) {
        callback(null, branchMap[_.last(args.split(/\s+/))] || [])
      }
      git.git.gitRevList = function(args, callback) {
        if (args.indexOf('--children') === 0) {
          callback(null, children[_.last(args.split(/\s+/))] || [[]])
        } else {
          callback(null, [parents[_.last(args.split(/\s+/))] || []])
        }
      }
      git.clearCache()
    })
    afterEach(function() {
      _.extend(git.git, originalGit)
    })
    describe('branchList', function() {
      describe('when HEAD is a merge commit', function() {
        it('gives merged branches', function(done) {
          var expected = ['origin/feature/foo', 'origin/production', 'origin/master']
          parents = {HEAD: ['abcd', 'efgh', '1234', '5678']}
          children =  { 'abcd': [['abcd', 'bbbbb']]
                      , 'efgh': [['efgh', 'abcd', ]]
                      , '1234': [['1234', 'efgh']]
                      , '5678': [['5678', '1234']]
                      }
          branchMap = { 'abcd': ['remotes/origin/master']
                      , 'efgh': ['remotes/origin/production']
                      , '1234': ['remotes/origin/feature/foo']
                      }
          git.branchList('HEAD', function(err, branches) {
            assert.deepEqual(branches, expected)
            done()
          })
        })
      })

      return;

      describe('when HEAD is not a merge', function() {
        it('gives parent branch of single commit branch', function(done) {
          var expected = []
          git.branchList('HEAD', function(err, branches) {
            assert.deepEqual(branches, expected)
            done()
          })
        })

        it('gives parent branch of multiple commit branch', function(done) {
          var expected = []
          git.branchList('HEAD', function(err, branches) {
            assert.deepEqual(branches, expected)
            done()
          })
        })
      })
    })
  })
})
