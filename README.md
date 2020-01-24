# JsonServices client

[![Appveyor build status](https://ci.appveyor.com/api/projects/status/jgilsn93anqp7x1c?svg=true)](https://ci.appveyor.com/project/yallie/jsonservicesclient)
[![Tests](https://img.shields.io/appveyor/tests/yallie/JsonServicesClient.svg)](https://ci.appveyor.com/project/yallie/JsonServicesClient/build/tests)
[![Code coverage](https://codecov.io/gh/yallie/JsonServicesClient/branch/master/graph/badge.svg)](https://codecov.io/gh/yallie/JsonServicesClient)

This is a TypeScript client for the [JsonServices](https://github.com/yallie/JsonServices) library.

# TSDX Bootstrap

This project was bootstrapped with [TSDX](https://github.com/jaredpalmer/tsdx).

## Local Development

Below is a list of commands you will probably find useful.

### `npm start` or `yarn start`

Runs the project in development/watch mode. Your project will be rebuilt upon changes. TSDX has a special logger for you convenience. Error messages are pretty printed and formatted for compatibility VS Code's Problems tab.

<img src="https://user-images.githubusercontent.com/4060187/52168303-574d3a00-26f6-11e9-9f3b-71dbec9ebfcb.gif" width="600" />

Your library will be rebuilt if you make edits.

### `npm run build` or `yarn build`

Bundles the package to the `dist` folder.
The package is optimized and bundled with Rollup into multiple formats (CommonJS, UMD, and ES Module).

<img src="https://user-images.githubusercontent.com/4060187/52168322-a98e5b00-26f6-11e9-8cf6-222d716b75ef.gif" width="600" />

### `npm test` or `yarn test`

Runs the test watcher (Jest) in an interactive mode.
By default, runs tests related to files changed since the last commit.
