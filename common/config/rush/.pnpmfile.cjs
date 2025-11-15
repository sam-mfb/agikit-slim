'use strict';

/**
 * When using the PNPM package manager, you can use pnpmfile.js to workaround
 * dependencies that have mistakes in their package.json file.
 */
module.exports = {
  hooks: {
    readPackage
  }
};

function readPackage(packageJson, context) {
  return packageJson;
}
