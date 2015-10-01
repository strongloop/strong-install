2015-10-01, Version 0.7.3
=========================

 * Use strongloop conventions for licensing (Sam Roberts)

 * Fix bad CLA URL in CONTRIBUTING.md (Ryan Graham)

 * Update contribution guidelines (Ryan Graham)

 * Consume entire error message before returning (Ryan Graham)

 * Update package license to match LICENSE.md (Sam Roberts)

 * doc: add CONTRIBUTING.md and LICENSE.md (Ben Noordhuis)

 * fixup! src: wrap some long lines (Ryan Graham)

 * src: wrap some long lines (Ryan Graham)

 * src: 'use strict' (Ryan Graham)

 * Use latest version of npm (Ryan Graham)

 * Fix name in README (Ryan Graham)


2014-02-13, Version 0.7.1
=========================

 * Disable broken options (Ryan Graham)

 * Include optionalDependencies in install (Ryan Graham)

 * Bump minor version for new features (Ryan Graham)

 * Add -N/--npm option to enable npm-install after install (Ryan Graham)

 * Fix global leak (Ryan Graham)

 * Track dependency tree as we recurse (Ryan Graham)

 * Update tests to reflect devDependencies from package.json (Ryan Graham)

 * Make -R/--recursive recursively install dependencies (Ryan Graham)

 * Extract package.json package lister (Ryan Graham)

 * Switch from async.each to async.queue (Ryan Graham)

 * fixup! Extract named installationTaskFromName function (Ryan Graham)

 * Include devDependencies when installing from package.json (Ryan Graham)

 * Extract named installationTaskFromName function (Ryan Graham)

 * Add -R/--recursive cli flag (Ryan Graham)

 * Increase maxSockets for http.Agent (Ryan Graham)

 * Add usage to README.md (Ryan Graham)


2013-12-20, Version 0.6.6
=========================

 * Make installation quiet when -q/--queit is set (Ryan Graham)

 * Refactor installList to take opts directly (Ryan Graham)

 * Add -q/--quiet flag to commands (Ryan Graham)

 * Cleanup posttest (Ryan Graham)


2013-12-17, Version 0.6.5
=========================

 * Bump patch (Ryan Graham)

 * Make error messages less menacing (Ryan Graham)

 * Use consistent coding style (Ryan Graham)

 * Update tests to reflect new Intaller dependency (Ryan Graham)

 * Extract version from installed package's package.json and print it (Ryan Graham)


2013-12-10, Version 0.6.4
=========================

 * Use timeout outside of connection (Ryan Graham)

 * Make log output less confusing (Ryan Graham)

 * Tidy up tests (Ryan Graham)


2013-12-09, Version 0.6.3
=========================

 * Bump patch version for bugfix release (Ryan Graham)

 * Stop trying branches after first successful installation (Ryan Graham)

 * Add test to verify installation is only done once (Ryan Graham)

 * Update remaining tests to use async commands.install() (Ryan Graham)

 * Update test to use callback for commands.install() (Ryan Graham)

 * Move exit code out of commands, make more testable (Ryan Graham)

 * Fix handling of 'sl-install install' (Ryan Graham)


2013-12-07, Version 0.6.2
=========================

 * Bump patch (Ryan Graham)

 * Set a 15 second timeout on package requests (Ryan Graham)


2013-12-07, Version 0.6.1
=========================

 * Patch release v0.6.1 (Ryan Graham)

 * Branches are after pkgName, not fixed position (Ryan Graham)


2013-12-06, Version 0.6.0
=========================

 * Fix 'branches' command (Ryan Graham)

 * Add test for branch lookup when none given (Ryan Graham)

 * Add tests for multiple branch arguments (Ryan Graham)

 * Use single-quotes (Ryan Graham)

 * camelCase all the_snakes (Ryan Graham)

 * Generate coverage report after tests, if coverage enabled (Ryan Graham)

 * Add tests for reading package.json (Ryan Graham)

 * Shorten long line (Ryan Graham)

 * Bump version, not backwards compatible (Ryan Graham)

 * Test for commands.branches() (Ryan Graham)

 * Make commands.branches() more testable (Ryan Graham)

 * New commands tests from original cli tests (Ryan Graham)

 * Clean up commands.js (Ryan Graham)

 * Separate bin from commands (Ryan Graham)

 * Fix progress dots (Ryan Graham)

 * Redirect stdout during testing (Ryan Graham)

 * Add cli tests (Ryan Graham)

 * Formatting (Ryan Graham)

 * Refactor Installer#install (Ryan Graham)

 * Refactor branch list conditional (Ryan Graham)

 * Vertical whitespace (Ryan Graham)


2013-11-26, Version 0.5.0
=========================

 * Bump minor version, this branch adds a lot (Ryan Graham)

 * Don't run jshint on ephemeral test code (Ryan Graham)

 * Fix jshint warnings (Ryan Graham)

 * If no package is specified, install 'dependencies' (Ryan Graham)

 * Avoid util.print, it is deprecated in node v0.11 (Sam Roberts)

 * Use mocked git for basic tests (Ryan Graham)


2013-11-23, Version 0.4.1
=========================

 * Patch release (Ryan Graham)

 * Reduce noise of output (Ryan Graham)

 * Ignore pull requests (Ryan Graham)

 * Tidy up tests (Ryan Graham)


2013-11-23, Version 0.4.0
=========================

 * Bump minor version for release (Ryan Graham)

 * Fill out remaining test rewrites (Ryan Graham)

 * Fix bug in merge commit resolution (Ryan Graham)

 * Start re-writing tests for git (Ryan Graham)

 * Remove dead code (Ryan Graham)

 * Commit is already in result of git rev-list (Ryan Graham)

 * Improve consistency in ref filtering (Ryan Graham)

 * Look further into history (Ryan Graham)

 * Stop resolving commits if we have them all (Ryan Graham)

 * Remove origin/HEAD from remote refs list (Ryan Graham)

 * Add remoteRefs for getting a list of all ref names (Ryan Graham)

 * Remove manual caching (Ryan Graham)


2013-11-22, Version 0.3.2
=========================

 * Bump patch for release (Ryan Graham)

 * Cleanup (Ryan Graham)

 * Revert history limit to retain compatibility (Ryan Graham)

 * Add istanbul for coverage (Ryan Graham)

 * Filter out duplicate commits before branch search (Ryan Graham)

 * Limit commit history search (Ryan Graham)

 * Simplify git module execution (Ryan Graham)


2013-11-22, Version 0.3.1
=========================

 * First release!
