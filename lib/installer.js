var urlParse = require('url').parse
  , http     = require('http')

module.exports = Installer

function Installer(dir) {
  if (!(this instanceof Installer)) return new Installer(dir)
  this.destination = dir
}

Installer.prototype.fromStream = function(stream, callback) {
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
