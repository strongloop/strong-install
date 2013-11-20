var exec  = require('child_process').exec
  , async = require('async')
  , util  = require('util')
  , _     = require('lodash')

var commit = process.env.COMMIT || process.env.GIT_COMMIT || 'HEAD'
  , branch = process.env.BRANCH || process.env.GIT_BRANCH || 'HEAD'

function commitAndParents(head, callback) {
  exec('git rev-list --parents -n 1 ' + head, parseCommits)
  function parseCommits(err, stdout, stderr) {
    if (err) {
      return callback(err)
    } else {
      return callback(null, stdout.trim().split(/\s+/))
    }
  }
}

function ancestry(head, callback) {
  commitAndParents(head, function(err, commits) {
    if (err) return callback(err)
    commits[1] = process.env.ghprbTargetBranch || commits[1]
    async.mapSeries(commits.reverse(),
                    getRefs,
                    function(err, results) {
                      callback(err, err ? null : _.flatten(results))
                    })
    })
}

function getRefs(sha1, callback) {
  exec('git show-ref',
      refsFilter(sha1,
                 _.partialRight(parseRefs,
                                callback)))
}

function matches(needle) {
  return function(haystack) {
    return (haystack.indexOf(needle) >= 0)
  }
}

function lines(thing) {
  if (Buffer.isBuffer(thing))
    return thing.toString().trim().split('\n')
  if (Array.isArray(thing))
    return thing
  return thing.trim().split('\n')
}

function refsFilter(sha1, callback) {
  return function (err, stdout, stderr) {
    var matching
    if (err) return callback(err)
    var matching = _(lines(stdout))
                    .select(matches(sha1))
                    .invoke('trim')
                    .value()
    callback(null, matching)
  }
}

function parseRefs(err, refs, callback) {
  if (err) {
    return callback(err)
  }
  callback(null,
    _( lines(refs) )
      .invoke('trim')
      .map(function(line) {
        if (/refs\/heads/.test( line )) {
          return line.split('refs/heads/')[1]
        } else {
          return line.split('refs/remotes/')[1].split('/', 2)[1]
        }
      })
      .value()
  )
}

var skip = [
  /^\s*$/,         // empty
  /[0-9a-f]{40}/,  // a plain commit hash
  /pr\/\d+\/.+/,   // a pull request ref
  /^HEAD$/         // not a useful reference name
]

function match(haystack, needle) {
  needle.test(haystack)
}

function matchAny(list) {
  return function(item) {
    return _.any(list, function(test) { return test.test(item) })
  }
}

function branches(commit, branch, callback) {
  ancestry(commit, function(err, refs) {
    if (err) {
      console.log(err)
      return callback(err)
    }
    refs.unshift(branch)
    callback(null, _(refs)
                      .reject(matchAny(skip))
                      .uniq()
                      .value()
            )
  })
}

exports.branchList = _.partial(branches, commit, branch)
