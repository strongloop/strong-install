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
  req.on('response', function(response) {
        if (response.statusCode != '200') {
          return callback(new Error('Error retrieving package: ' + response.body))
        } else {
          return self.fromStream(response, callback)
        }
      })
     .on('error', callback)
}
