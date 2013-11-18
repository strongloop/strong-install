var urlParse = require('url').parse
  , http     = require('http')
  , zlib     = require('zlib')
  , tar      = require('tar')

module.exports = Installer

function Installer(dir) {
  if (!(this instanceof Installer)) return new Installer(dir)
  this.destination = dir
}

Installer.prototype.tarExtractor = function() {
  return tar.Extract({ path: this.destination, strip: 1 })
};

Installer.prototype.tgzExtractor = function(tgzStream) {
  return tgzStream.pipe( zlib.createGunzip() )
                  .pipe( this.tarExtractor() )
};

Installer.prototype.fromStream = function(stream, callback) {
  this.tgzExtractor(stream)
      .on('error', callback)
      .on('entry', entryLogger)
      .on('end', callback)
}

function entryLogger(entry) {
  // console.log(entry.path)
}

Installer.prototype.install = function(pkgUrl, callback) {
  var self = this
    , url = urlParse(pkgUrl)
    , req = http.get(url)
  req.on('response', function(res) {
        if (res.statusCode != '200') {
          return res.on('readable', function() {
            return callback(new Error('Error retrieving package from '
                                      + pkgUrl
                                      + ' - '
                                      + res.read()))
          })
        } else {
          return self.fromStream(res, callback)
        }
      })
     .on('error', callback)
}
