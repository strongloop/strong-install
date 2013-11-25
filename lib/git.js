var exec  = require('child_process').exec
  , async = require('async')
  , util  = require('util')
  , _     = require('lodash')

function getParents(head, callback) {
  git.gitRevList('--parents -n 1 ' + head, function(err, lines) {
    var parents
    if (err) return callback(err)
    parents = lines.shift() // only want first line, hence -n 1 above
    if (parents.length > 2) {
      // merge commit, we want merge sources before destination
      callback(null, parents.reverse())
    } else {
      // single parent commit
      callback(null, parents)
    }
  })
}

function refsMap(callback) {
  git.gitShowRef(function refsFilter(err, lines) {
    var mapping = {}
    if (err) return callback(err)
    _(lines)
      .invoke('trim')
      .map(toWords)
      .each(function(line) {
        var sha1 = line[0]
          , ref  = line[1]
        mapping[sha1] = mapping[sha1] || []
        mapping[sha1].push(ref)
      })
    callback(null, mapping)
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

function commitHistory(start, callback) {
  start = start || 'HEAD'
  var error = callback || console.log
    , success = _.partial(error, null)
  git.gitRevList('--children ' + start, function(err, revs) {
    var foundFork = false
    if (err) return error(err)
    _(revs)
      .select(function(commits) {
        foundFork = foundFork || commits.length > 2
        return !foundFork || commits.length > 2
      })
      .tap(success)
  })
}

function remoteRefs(callback) {
  var success = _.partial(callback, null)
    , failure = callback
  refsMap(function(err, mapping) {
    if (err) return failure(err)
    _(_.values(mapping))
      .flatten()
      .select(hasPrefix('refs/remotes/origin/'))
      .reject(matches(/origin\/HEAD$/))
      .reject(matches(/\/origin\/pr\/\d+\/(merge|head)/))
      .map(stripPrefix('refs/remotes/'))
      .uniq()
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
      .reject(matches(/\/origin\/pr\/\d+\/(merge|head)/))
      .map(stripPrefix('remotes/'))
      .uniq()
      .tap(success)
  })
}

function nearestBranches(commit, callback) {
  var error = (callback = callback || console.log)
    , success = _.partial(error, null)
  remoteRefs(function(err, refs) {
    function lazyBranchResolver(commit, callback) {
      if (refs.length === 0) {
        callback(null, [])
      } else {
        branchesContaining(commit, function(err, branches) {
          if (err) return callback(err)
          refs = _.difference(refs, branches)
          callback(null, branches)
        })
      }
    }
    getParents(commit, function(err, parents) {
      async.map(parents, commitHistory, function(err, commits) {
        commits = _(commits).flatten().uniq().value()
        async.mapLimit(commits, 50, lazyBranchResolver,
                       function(err, branches) {
          if (err) return error(err)
          _(branches)
            .flatten().uniq()
            .tap(success)
        })
      })
    })
  })
}

var git = {
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
  }
}

function branchList(commit, callback) {
  if (_.isFunction(commit) && !callback) {
    callback = commit
    commit = git.currentCommit()
  }
  nearestBranches(commit, function(err, branches) {
    if (err) return callback(err)
    callback(null, _.map(branches, stripPrefix('remotes/')))
  })
}

module.exports = {
  git: git,
  clearCache: function() { },
  branchList: branchList
}

if (require.main === module) {
  remoteRefs(console.log)
  branchList(process.argv[2] || 'HEAD', console.log)
}
