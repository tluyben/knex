// ClickHouse Schema Compiler
// -------------------------
const SchemaCompiler = require('../../../schema/compiler');

class SchemaCompiler_ClickHouse extends SchemaCompiler {
  constructor(client, builder) {
    super(client, builder);
  }

  // ClickHouse doesn't support schemas in the traditional sense
  createSchema() {
    return '';
  }

  dropSchema() {
    return '';
  }

  // Handle ClickHouse specific table creation
  createTable() {
    const tableBuilder = this.tableBuilder;
    const columns = tableBuilder._columns;
    const engine = tableBuilder._engine || 'MergeTree';
    const orderBy = tableBuilder._orderBy || '';
    const partitionBy = tableBuilder._partitionBy || '';
    const settings = tableBuilder._settings || {};

    // Build settings string
    const settingsStr = Object.entries(settings)
      .map(([key, value]) => `${key} = ${value}`)
      .join(', ');

    let sql = `CREATE TABLE ${this.tableNameRaw} (`;
    sql += columns.map((col) => col.toSQL()).join(', ');
    sql += `) ENGINE = ${engine}`;

    if (partitionBy) {
      sql += ` PARTITION BY ${partitionBy}`;
    }

    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }

    if (settingsStr) {
      sql += ` SETTINGS ${settingsStr}`;
    }

    return sql;
  }

  // Drop a table
  dropTable(tableName) {
    return `DROP TABLE IF EXISTS ${this.formatter.wrap(tableName)}`;
  }

  // Rename a table
  renameTable(from, to) {
    return `RENAME TABLE ${this.formatter.wrap(from)} TO ${this.formatter.wrap(to)}`;
  }

  // Add a column to a table
  addColumn(tableName, column) {
    return `ALTER TABLE ${this.formatter.wrap(tableName)} ADD COLUMN ${column.toSQL()}`;
  }

  // Drop a column from a table
  dropColumn(tableName, column) {
    return `ALTER TABLE ${this.formatter.wrap(tableName)} DROP COLUMN ${this.formatter.wrap(column)}`;
  }

  // Rename a column
  renameColumn(tableName, from, to) {
    return `ALTER TABLE ${this.formatter.wrap(tableName)} RENAME COLUMN ${this.formatter.wrap(from)} TO ${this.formatter.wrap(to)}`;
  }

  // Modify a column
  alterColumn(tableName, column) {
    return `ALTER TABLE ${this.formatter.wrap(tableName)} MODIFY COLUMN ${column.toSQL()}`;
  }

  // Handle materialized views
  createView(viewName, select) {
    const engine = this.viewBuilder._engine || 'MaterializedView';
    const targetTable = this.viewBuilder._targetTable;
    const orderBy = this.viewBuilder._orderBy || '';
    
    let sql = `CREATE ${engine} ${this.formatter.wrap(viewName)}`;
    
    if (targetTable) {
      sql += ` TO ${this.formatter.wrap(targetTable)}`;
    }
    
    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }
    
    sql += ` AS ${select}`;
    
    return sql;
  }

  // Drop a view
  dropView(viewName) {
    return `DROP VIEW IF EXISTS ${this.formatter.wrap(viewName)}`;
  }
}

module.exports = SchemaCompiler_ClickHouse;
