
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./json-services-client.cjs.production.min.js')
} else {
  module.exports = require('./json-services-client.cjs.development.js')
}
