#!/usr/bin/env node

var commands = require('../').commands
  , program  = require('commander')
  , self     = require('../package.json')

process.title = 'sl-install'

program
  .version(self.version)
  .option('-r, --repo <url>',
          'Set repository to install from',
          process.env.ALT_REPO)
  .option('-d, --destination <dir>',
          'Set directory to install from',
          'node_modules')
  .option('-q, --quiet',
          'Suppress unimportant output',
          false)

program
  .command('install [package] [branches...]')
  .description('install given package or all dependencies')
  .action(function (pkg, branches) {
    var pkgNamePos = pkg ? this.rawArgs.indexOf(pkg, 2) : this.rawArgs.length
    branches = this.rawArgs.slice(pkgNamePos + 1)
    commands.install(pkg, branches, this, function(err) {
      if (err) {
        process.exit(1)
      }
    })
  })

program
  .command('branches')
  .description('print a list of branches for resolving dependencies against')
  .action(commands.branches)

program
  .command('*')
  .action(function() { program.help() })

if (program.parse(process.argv).args.length === 0) {
  program.help()
}
