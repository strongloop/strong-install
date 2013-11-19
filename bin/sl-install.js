#!/usr/bin/env node

var cli = require('../').cli

process.title = 'sl-install'

cli.run(process.argv, process.env)
