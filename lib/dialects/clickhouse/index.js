// ClickHouse
// -------
const Client = require('../../client');
const { promisify } = require('util');
const { makeEscape } = require('../../util/string');

const Transaction = require('../../execution/transaction');
const QueryCompiler = require('./query/ch-querycompiler');
const SchemaCompiler = require('./schema/ch-compiler');
const TableCompiler = require('./schema/ch-tablecompiler');
const ColumnCompiler = require('./schema/ch-columncompiler');

class Client_ClickHouse extends Client {
  constructor(config) {
    super(config);
  }

  transaction() {
    return new Transaction(this, ...arguments);
  }

  queryCompiler(builder, formatter) {
    return new QueryCompiler(this, builder, formatter);
  }

  schemaCompiler() {
    return new SchemaCompiler(this, ...arguments);
  }

  tableCompiler() {
    return new TableCompiler(this, ...arguments);
  }

  columnCompiler() {
    return new ColumnCompiler(this, ...arguments);
  }

  _driver() {
    return require('@clickhouse/client');
  }

  // Get a raw connection from the database
  async acquireRawConnection() {
    const client = this.driver.createClient({
      host: this.connectionSettings.host || 'localhost',
      port: this.connectionSettings.port || 8123,
      username: this.connectionSettings.user || 'default',
      password: this.connectionSettings.password || '',
      database: this.connectionSettings.database || 'default',
      protocol: this.connectionSettings.protocol || 'http:',
    });

    return client;
  }

  // Used to explicitly close a connection
  async destroyRawConnection(connection) {
    try {
      await connection.close();
    } catch (err) {
      this.logger.warn(`Error closing ClickHouse connection: ${err}`);
    }
  }

  // Execute a query on the specified connection
  async _query(connection, obj) {
    if (!obj.sql) throw new Error('The query is empty');

    try {
      const result = await connection.query({
        query: obj.sql,
        parameters: obj.bindings || [],
      });

      obj.response = await result.json();
      return obj;
    } catch (err) {
      throw this._formatError(err);
    }
  }

  _stream(connection, obj, stream) {
    if (!obj.sql) throw new Error('The query is empty');

    return new Promise((resolve, reject) => {
      try {
        const queryStream = connection.query({
          query: obj.sql,
          parameters: obj.bindings || [],
          format: 'JSONEachRow',
        });

        queryStream
          .on('data', (rows) => {
            stream.write(rows);
          })
          .on('error', (error) => {
            reject(error);
            stream.emit('error', error);
          })
          .on('end', () => {
            stream.end();
            resolve();
          });
      } catch (err) {
        reject(this._formatError(err));
      }
    });
  }

  _formatError(err) {
    // Format ClickHouse specific errors
    if (err.code) {
      switch (err.code) {
        case 'ER_ACCESS_DENIED_ERROR':
          err.message = 'Access denied for user';
          break;
        case 'ER_DBACCESS_DENIED_ERROR':
          err.message = 'Database access denied';
          break;
      }
    }
    return err;
  }

  processResponse(obj, runner) {
    if (obj.output) return obj.output.call(runner, obj.response);
    if (obj.method === 'raw') return obj.response;
    if (obj.method === 'select' || obj.method === 'first') {
      const resp = obj.response;
      if (resp.data === undefined) return [];
      if (obj.method === 'first') return resp.data[0];
      return resp.data;
    }
    if (obj.method === 'insert') return [obj.response.data];
    if (obj.method === 'del' || obj.method === 'update') {
      return obj.response.data;
    }
    return obj.response;
  }
}

Object.assign(Client_ClickHouse.prototype, {
  dialect: 'clickhouse',
  driverName: '@clickhouse/client',

  _escapeBinding: makeEscape({
    escapeString(str) {
      return `'${str.replace(/'/g, "\\'")}'`;
    },
  }),
});

module.exports = Client_ClickHouse;
