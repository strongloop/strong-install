var exec  = require('child_process').exec
  , async = require('async')
  , util  = require('util')
  , _     = require('lodash')

function ancestry(head, callback) {
  git.gitRevList('--parents -n 1 ' + head, function(err, commits) {
    if (err) return callback(err)
    commits[1] = git.mergeTargetOr(commits[1])
    async.mapSeries(commits.reverse(),
                    refsFor,
                    function(err, results) {
                      callback(err, err ? null : _.flatten(results))
                    })
    })
}

function refsFor(sha1, callback) {
  var refsFilter = grep(new RegExp(sha1), function(err, refs) {
    if (err) return callback(err)
    parseRefs(refs, callback)
  })
  git.gitShowRef(refsFilter)
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

function parseRefs(refs, callback) {
  callback(null,
    _(refs)
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
  ancestry(commit, function(err, refs) {
    if (err) {
      console.log(err)
      return callback(err)
    }
    refs.unshift(branch)
    callback(null, _(refs)
                      .reject(matchAny(skip))
                      .map(ensurePrefix('origin/'))
                      .uniq()
                      .value()
            )
  })
}

function forks(start, callback) {
  start = start || 'HEAD'
  var error = callback || console.log
    , success = _.partial(error, null)
  git.gitRevList('--children ' + start, function(err, revs) {
    if (err) return error(err)
    _(revs)
      .select(function(commits) {
        return commits.length > 2
      })
      .flatten()
      .uniq()
      .tap(success)
  })
}


function branchesContaining(commit, callback) {
  var error = callback || console.log
    , success = _.partial(error, null)
  commit = commit || 'HEAD'
  git.gitBranch('--all --contains ' + commit, function(err, branches) {
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

function nearestBranches(commit, callback) {
  var error = (callback = callback || console.log)
    , success = _.partial(error, null)
  forks(process.argv[2], function(err, commits) {
    async.map(commits, function(commit, callback) {
      branchesContaining(commit, callback)
    }, function(err, branches) {
      if (err)
        error(err)
      else
        async.sortBy(_(branches).flatten().uniq().value(),
                    function(br, callback) {
                      git.gitLog('-1 --pretty=format:%at ' + br, function(err, timestamp) {
                        callback(err, err ? null : -parseInt(timestamp))
                      })
                    }, callback)
    })
  })
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
      if (err) return callback(err)
      _(lines(stdout))
        .map(toWords)
        .tap(_.partial(callback, err))
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
  return branches(git.currentCommit(), git.currentBranch(), callback)
}

module.exports = {
  git: git,
  branchList: branchList,
  forks: forks
}

if (require.main === module) {
  nearestBranches(process.argv[2], console.log)
  // forks(process.argv[2], function(err, commits) {
  //   // console.log(err, commits)
  //   async.map(commits, function(commit, callback) {
  //     branchesContaining(commit, callback)
  //   }, function(err, branches) {
  //     _(branches).flatten().uniq().tap(console.log)
  //     // console.log(err, branches)
  //   })
  // })
}
