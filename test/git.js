var exec   = require('child_process').exec
  , assert = require('assert')
  , http   = require('http')
  , fs     = require('fs')
  , _      = require('lodash')

var git = require('../lib/git')

describe('git', function() {

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

      it('handles merge commits', function(done) {
        // 'abcd' - HEAD, origin/master +origin/production +origin/feature/foo
        // 'efgh' - origin/production
        // '1234' - origin/feature/foo
        // '5678' -
        // '0000'
        var expected =  [ 'origin/feature/foo'
                        , 'origin/production'
                        , 'origin/master'
                        ]
        parents = {'HEAD': ['abcd', 'efgh', '1234', '5678']}
        children =  { 'abcd': [['abcd']]
                    , 'efgh': [['efgh']]
                    , '1234': [['1234']]
                    , '5678': [['5678']]
                    }
        branchMap = { 'abcd': ['remotes/origin/master']
                    , 'efgh': ['remotes/origin/production']
                    , '1234': [ 'remotes/origin/feature/foo'
                              , 'remotes/origin/pr/1/head'
                              , 'remotes/origin/pr/1/merge'
                              ]
                    }
        git.branchList('HEAD', function(err, branches) {
          assert.deepEqual(branches, expected)
          done()
        })
      })
    })

    it('handles non-merge commits', function(done) {
      // '1234' - HEAD, origin/feature/foo
      // 'efgh' - origin/production
      // 'abcd' - origin/master
      // '0000'
      var expected =  [ 'origin/feature/foo'
                      , 'origin/production'
                      , 'origin/master'
                      ]
      parents = {'HEAD': ['1234', 'efgh']}
      children =  { 'abcd': [ ['abcd']
                            , ['0000', 'abcd']
                            ]
                  , 'efgh': [ ['efgh']
                            , ['abcd', '1234']
                            , ['0000', 'abcd']
                            ]
                  , '1234': [ ['1234']
                            , ['efgh', '1234']
                            , ['abcd', '1234']
                            , ['0000', 'abcd']
                            ]
                  }
      branchMap = { 'abcd': [ 'remotes/origin/master'
                            , 'remotes/origin/production'
                            , 'remotes/origin/feature/foo'
                            ]
                  , 'efgh': [ 'remotes/origin/production'
                            , 'remotes/origin/feature/foo'
                            ]
                  , '1234': ['remotes/origin/feature/foo']
                  }
      git.branchList('HEAD', function(err, branches) {
        assert.deepEqual(branches, expected)
        done()
      })
    })

    it('handles branches with multiple commits', function(done) {
      // '1234' - HEAD, origin/feature/foo
      // 'aaaa'
      // 'bbbb'
      // 'efgh' - origin/production
      // 'abcd' - origin/master
      // '0000'
      var expected =  [ 'origin/feature/foo'
                      , 'origin/production'
                      , 'origin/master'
                      ]
      parents = {'HEAD': ['1234', 'efgh']}
      children =  { 'abcd': [['abcd'], ['0000', 'abcd']]
                  , 'efgh': [['efgh'], ['abcd', '1234'], ['0000', 'abcd']]
                  , '1234': [ ['1234']
                            , ['aaaa', '1234']
                            , ['bbbb', 'aaaa']
                            , ['efgh', '1234']
                            , ['abcd', '1234']
                            , ['0000', 'abcd']
                            ]
                  }
      branchMap = { 'abcd': [ 'remotes/origin/master'
                            , 'remotes/origin/production'
                            , 'remotes/origin/feature/foo'
                            ]
                  , 'efgh': [ 'remotes/origin/production'
                            , 'remotes/origin/feature/foo'
                            ]
                  , '1234': [ 'remotes/origin/feature/foo' ]
                  }
      git.branchList('HEAD', function(err, branches) {
        assert.deepEqual(branches, expected)
        done()
      })
    })
  })
})
