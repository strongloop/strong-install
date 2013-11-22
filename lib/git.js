var exec  = require('child_process').exec
  , async = require('async')
  , util  = require('util')
  , _     = require('lodash')

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
  module.exports.commitAndParents(head, function(err, commits) {
    if (err) return callback(err)
    commits[1] = module.exports.mergeTargetOr(commits[1])
    async.mapSeries(commits.reverse(),
                    refsFor,
                    function(err, results) {
                      callback(err, err ? null : _.flatten(results))
                    })
    })
}

function refsFor(sha1, callback) {
  var refsFilter = grep(sha1, _.partialRight(parseRefs, callback))
  module.exports.getRefs(refsFilter)
}

function getRefs(callback) {
  exec('git show-ref', callback)
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

function grep(needle, callback) {
  return function (err, stdout, stderr) {
    var matching
    if (err) return callback(err)
    var matching = _(lines(stdout))
                    .select(matches(needle))
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
          return _.rest(line.split('refs/remotes/')[1].split('/')).join('/')
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

function prefixWith(prefix) {
  return function(item) {
    return prefix + item
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
                      .map(prefixWith('origin/'))
                      .uniq()
                      .value()
            )
  })
}

function currentCommit() {
  return process.env.COMMIT || process.env.GIT_COMMIT || 'HEAD'
}

function currentBranch() {
  return process.env.BRANCH || process.env.GIT_BRANCH || 'HEAD'
}

function branchList(callback) {
  return branches(module.exports.currentCommit(), module.exports.currentBranch(), callback)
}

function mergeTargetOr(alternative) {
  return process.env.ghprbTargetBranch || alternative
}

module.exports = {
  branchList: branchList,
  getRefs: getRefs,
  commitAndParents: commitAndParents,
  currentBranch: currentBranch,
  currentCommit: currentCommit,
  mergeTargetOr: mergeTargetOr
}
