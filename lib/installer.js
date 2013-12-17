var events   = require('events')
  , _        = require('lodash')
  , util     = require('util')
  , http     = require('http')
  , zlib     = require('zlib')
  , url      = require('url')
  , tar      = require('tar')


util.inherits(Installer, events.EventEmitter)

module.exports = Installer

function Installer(dir) {
  if (!(this instanceof Installer)) { return new Installer(dir) }
  events.EventEmitter.call(this)
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
      .on('entry', _.bind(this.emit, this, 'entry'))
      .on('end', callback)
}

Installer.prototype.install = function(pkgUrl, callback) {
  var self = this
    , req  = http.get(url.parse(pkgUrl))
    , timeout = setTimeout(function() {
      req.abort()
    }, 15000)

  req.on('response', onResponse)
     .on('error', callback)

  function onResponse(res) {
    clearTimeout(timeout)
    if (res.statusCode != '200') {
      return res.on('readable', readError)
    } else {
      return self.fromStream(res, callback)
    }
    function readError() {
      callback(new Error('Error retrieving package from ' +
                          pkgUrl + ' - ' + res.statusCode,
                          res.read()))
    }
  }
}
