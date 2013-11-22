var exec  = require('child_process').exec
  , async = require('async')
  , util  = require('util')
  , _     = require('lodash')

function getParents(head, callback) {
  git.gitRevList('--parents -n 1 ' + head, function(err, lines) {
    if (err) return callback(err)
    callback(null, lines.shift()) // first line only
  })
}

function refsMap(callback) {
  if (cache.refsMap) return process.nextTick(function() { callback(null, cache.refsMap) })
  git.gitShowRef(function refsFilter(err, lines) {
    var isRefHead = hasPrefix('refs/heads/')
      , stripRemoteRef = stripPrefix('refs/remotes/origin/')
    if (err) {
      cache.refsMap = null
    } else {
      cache.refsMap = {}
      _(lines)
        .invoke('trim')
        .map(toWords)
        .reject(function(line) { return isRefHead(line[1]) })
        .map(function(line) { return [line[0], stripRemoteRef(line[1])] })
        .each(function(line) {
          var sha1 = line[0]
            , ref  = line[1]
          cache.refsMap[sha1] = cache.refsMap[sha1] || []
          cache.refsMap[sha1].push(ref)
        })
    }
    callback(null, cache.refsMap)
  })
}

function refsFor(sha1, callback) {
  refsMap(function(err, mapping) {
    if (err) return callback(err)
    callback(null, mapping[sha1] || [])
  })
}

function matches(needle) {
  return function(haystack) {
    return needle.test(haystack)
  }
}

function lines(thing) {
  if (Buffer.isBuffer(thing))
    return thing.toString().trim().split('\n')
  if (Array.isArray(thing))
    return thing
  return thing.trim().split('\n')
}

function toWords(line) {
  return line.split(/\s+/)
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

function ensurePrefix(prefix) {
  var prefixed = hasPrefix(prefix)
  return function(item) {
    return prefixed(item) ? item : prefix + item
  }
}

function stripPrefix(prefix) {
  var prefixed = hasPrefix(prefix)
  return function(item) {
    return prefixed(item) ? item.slice(prefix.length) : item
  }
}

function hasPrefix(prefix) {
  return function(item) {
    return item.indexOf(prefix) === 0
  }
}

function branches(commit, branch, callback) {
  getParents(commit, function(err, parents) {
    if (err) {
      console.log(err)
      return callback(err)
    }
    if (parents.length > 1) {
      // we are a merge
      async.mapSeries(parents.reverse(), refsFor, function(err, refs) {
        refs.unshift(branch)
        refs.unshift(commit)
        _(refs)
          .flatten()
          .reject(matchAny(skip))
          .map(ensurePrefix('origin/'))
          .uniq()
          .tap(function(branches) {
            callback(null, branches)
          })
      })
    } else {
      // we are not a merge commit, we need to walk our history
      refsFor(parents[0], function(err, refs) {

      })
    }
  })
}

function toFirstFork(start, callback) {
  start = start || 'HEAD'
  var error = callback || console.log
    , success = _.partial(error, null)
  git.gitRevList('--children ' + start, function(err, revs) {
    var foundFork = false
    if (err) return error(err)
    _(revs)
      .select(function(commits) {
        foundFork = foundFork || commits.length > 2
        return !foundFork
      })
      // .flatten()
      // .uniq()
      .tap(success)
  })
}


function branchesContaining(commit, callback) {
  var error = callback || console.log
    , success = _.partial(error, null)
  commit = commit || 'HEAD'
  git.gitBranch('-a --contains ' + commit, function(err, branches) {
    if (err) return error(err)
    _(branches)
      .select(hasPrefix('remotes/'))
      .reject(matches(/\/origin\/HEAD$/))
      // .map(stripPrefix('remotes/'))
      // .map(ensurePrefix('origin/'))
      .uniq()
      .tap(success)
  })
}

function getTimestamp(commit, callback) {
  git.gitLog('-1 --pretty=format:%at ' + commit, function(err, timestamp) {
    callback(err, err ? null : -parseInt(timestamp))
  })
}

function nearestBranches(commit, callback) {
  var error = (callback = callback || console.log)
    , success = _.partial(error, null)
  getParents(commit, function(err, parents) {
    async.map(parents, toFirstFork, function(err, commits) {
      commits = _.flatten(commits)
      // commits.unshift(commit)
      async.mapLimit(commits, 5, branchesContaining, function(err, branches) {
        if (err) return error(err)
        branches = _(branches).flatten().uniq().value()
        callback(null, branches)
        // async.sortBy(branches, getTimestamp, callback)
      })
    })
  })
}

var cache = {
  refsMap: null
}

var git = {
  gitLog: function gitLog(args, callback) {
    var error = callback || console.log
      , success = _.partial(error, null)
    exec('git log ' + args, function(err, stdout, stderr) {
      if (err) return error(err)
      success(stdout.trim())
    })
  },
  gitBranch: function gitBranch(args, callback) {
    var error = callback || console.log
      , success = _.partial(error, null)
    exec('git branch ' + args, function(err, stdout, stderr) {
      if (err) return error(err)
      _(lines(stdout))
        .map(function(line) {
          return line.slice(2).trim()
        })
        .map(function(line) {
          return line.split(' -> ')
        })
        .flatten()
        .tap(success)
    })
  },
  gitRevList: function gitRevList(args, callback) {
    exec('git rev-list ' + args, function(err, stdout, stderr) {
      callback(err, err ? null : _.map(lines(stdout), toWords))
    })
  },
  gitShowRef: function gitShowRef(callback) {
    exec('git show-ref', function(err, stdout, stderr) {
      if (err) return callback(err)
      callback(null, _(lines(stdout)).invoke('trim').value())
    })
  },
  currentCommit: function currentCommit() {
    return process.env.COMMIT || process.env.GIT_COMMIT || 'HEAD'
  },
  currentBranch: function currentBranch() {
    return process.env.BRANCH || process.env.GIT_BRANCH || 'HEAD'
  },
  mergeTargetOr: function mergeTargetOr(alternative) {
    return process.env.ghprbTargetBranch || alternative
  }
}

function branchList(callback) {
  nearestBranches(git.currentCommit(), function(err, branches) {
    if (err) return callback(err)
    callback(null, _.map(branches, stripPrefix('remotes/')))
  })
  // return branches(git.currentCommit(), git.currentBranch(), callback)
}

module.exports = {
  git: git,
  clearCache: function() {
    cache.refsMap = null
  },
  branchList: branchList
}

if (require.main === module) {
  nearestBranches(process.argv[2], function(err, branches) {
    if (err) return callback(err)
    console.log(_.map(branches, stripPrefix('remotes/')))
  })
}
