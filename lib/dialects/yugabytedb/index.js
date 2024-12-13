// YugabyteDB
// -------
const Client_PG = require('../postgres');

class Client_YugabyteDB extends Client_PG {
  constructor(config) {
    super(config);
  }

  // Override version parsing for YugabyteDB's version string format
  _parseVersion(versionString) {
    // YugabyteDB version string format: 
    // "PostgreSQL 14.9 (YugabyteDB 2.19.1.0-b140 LANG=C)"
    const matches = /^PostgreSQL .* \(YugabyteDB (.*?)( |\))/.exec(versionString);
    return matches ? matches[1] : versionString;
  }
}

Object.assign(Client_YugabyteDB.prototype, {
  dialect: 'yugabytedb',
  driverName: 'pg',
  canCancelQuery: true,
});

module.exports = Client_YugabyteDB;
