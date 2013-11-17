function Installer(dir) {
  if (!(this instanceof Installer)) return new Installer(dir)
  this.destination = dir
}

module.exports = Installer
