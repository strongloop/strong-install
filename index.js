var zlib = require('zlib')
  , tar  = require('tar')
  , fs   = require('fs')

var gunzip = zlib.createGunzip()

var pkg = 'sl-install-0.0.0.tgz' //process.args[1]
  , dst = 'node-modules/sl-install'

var tgz    = fs.createReadStream(pkg)
  , pkgdir = tar.Extract({path: dst})

tgz.pipe(gunzip)
   .pipe(pkgdir)
   .on('error', function (err) {
      console.log('error', err)
    })
   .on('end', function () {
      console.log("done")
   })
