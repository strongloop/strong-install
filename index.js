var _    = require('lodash')
  , http = require('http')
  , zlib = require('zlib')
  , url  = require('url')
  , tar  = require('tar')
  , fs   = require('fs')

var gunzip = zlib.createGunzip()

var pkg = process.argv[2]
  , dst = 'node_modules/' + pkg

var pkgdir = tar.Extract({ path: dst, strip: 1 })

var repo = process.env.ALT_REPO

var branches = _.rest(process.argv, 3)

var urls = _.map(branches, _.curry(pkgUrl)(repo, pkg))

if (!pkg || urls.length < 1) {
  done("node index.js <pkg_name> <branch> [branch..]")
} else {
  console.log(urls)
  install(urls, pkg)
}

function install(urls, name) {
  if (urls.length < 1) {
    return setImmediate(_.partial(done, "No more urls to try.."))
  }
  var nextUrl = _.first(urls)
  http.get(url.parse(nextUrl), function (res) {
    if (res.statusCode != '200') {
      console.log("Failed: " + nextUrl)
      setImmediate(_.partial(install, _.rest(urls), name))
    } else {
      res.pipe(gunzip)
        .pipe(pkgdir)
        .on('error', function (err) {
          console.log('error ' + err)
          setImmediate(_.partial(install, _.rest(urls), name))
        })
        .on('entry', function (entry) {
          console.log(entry.path)
        })
        .on('end', _.partial(done, 'finished downloading from ' + nextUrl))
    }
  })
}

function done(msg) {
  console.log("Done: " + msg)
}

function pkgUrl(repo, name, branch) {
  return repo + name + '/' + branch + '/' + name + '-LATEST.tgz'
}
