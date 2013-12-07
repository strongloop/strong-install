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

program
  .command('install [package] [branches...]')
  .description('install given package or all dependencies')
  .action(function (pkg, branches) {
    branches = this.rawArgs.slice(4)
    commands.install(pkg, branches, this)
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
