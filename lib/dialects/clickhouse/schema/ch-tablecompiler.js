// ClickHouse Table Compiler
// -------------------------
const TableCompiler = require('../../../schema/tablecompiler');

class TableCompiler_ClickHouse extends TableCompiler {
  constructor(client, tableBuilder) {
    super(client, tableBuilder);
    this.engineOptions = {};
  }

  // Create a new table
  createQuery(columns, ifNot) {
    const engine = this.tableBuilder._engine || 'MergeTree';
    const orderBy = this.tableBuilder._orderBy || '';
    const partitionBy = this.tableBuilder._partitionBy || '';
    const ttl = this.tableBuilder._ttl || '';
    const settings = this.tableBuilder._settings || {};

    // Build settings string
    const settingsStr = Object.entries(settings)
      .map(([key, value]) => `${key} = ${value}`)
      .join(', ');

    let sql = `CREATE TABLE ${ifNot ? 'IF NOT EXISTS ' : ''}${this.tableName()} (`;
    sql += columns.join(', ');
    sql += `) ENGINE = ${engine}`;

    if (partitionBy) {
      sql += ` PARTITION BY ${partitionBy}`;
    }

    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }

    if (ttl) {
      sql += ` TTL ${ttl}`;
    }

    if (settingsStr) {
      sql += ` SETTINGS ${settingsStr}`;
    }

    this.pushQuery({
      sql,
    });
  }

  // Drop a table
  dropIfExists() {
    this.pushQuery(`DROP TABLE IF EXISTS ${this.tableName()}`);
  }

  drop() {
    this.pushQuery(`DROP TABLE ${this.tableName()}`);
  }

  // Rename a table
  renameTable(to) {
    this.pushQuery(`RENAME TABLE ${this.tableName()} TO ${this.formatter.wrap(to)}`);
  }

  // Add a column to the table
  addColumn(column) {
    this.pushQuery({
      sql: `ALTER TABLE ${this.tableName()} ADD COLUMN ${column}`,
    });
  }

  // Change a column
  alterColumn(column) {
    this.pushQuery({
      sql: `ALTER TABLE ${this.tableName()} MODIFY COLUMN ${column}`,
    });
  }

  // Drop a column from the table
  dropColumn(column) {
    this.pushQuery({
      sql: `ALTER TABLE ${this.tableName()} DROP COLUMN ${this.formatter.wrap(column)}`,
    });
  }

  // Rename a column
  renameColumn(from, to) {
    this.pushQuery({
      sql: `ALTER TABLE ${this.tableName()} RENAME COLUMN ${this.formatter.wrap(from)} TO ${this.formatter.wrap(to)}`,
    });
  }

  // Add primary key
  primary(columns) {
    if (!this.tableBuilder._orderBy) {
      this.tableBuilder._orderBy = `(${this.formatter.columnize(columns)})`;
    }
  }

  // Add table comment
  comment(comment) {
    this.pushQuery({
      sql: `ALTER TABLE ${this.tableName()} COMMENT '${comment}'`,
    });
  }

  // Set table TTL
  setTTL(ttl) {
    this.pushQuery({
      sql: `ALTER TABLE ${this.tableName()} MODIFY TTL ${ttl}`,
    });
  }

  // Optimize table
  optimize() {
    this.pushQuery({
      sql: `OPTIMIZE TABLE ${this.tableName()} FINAL`,
    });
  }

  // Add materialized column
  materializedColumn(name, type, expr) {
    this.pushQuery({
      sql: `ALTER TABLE ${this.tableName()} ADD COLUMN ${this.formatter.wrap(name)} ${type} MATERIALIZED ${expr}`,
    });
  }

  // Add alias column
  aliasColumn(name, type, expr) {
    this.pushQuery({
      sql: `ALTER TABLE ${this.tableName()} ADD COLUMN ${this.formatter.wrap(name)} ${type} ALIAS ${expr}`,
    });
  }
}

module.exports = TableCompiler_ClickHouse;
