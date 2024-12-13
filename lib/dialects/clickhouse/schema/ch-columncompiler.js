// ClickHouse Column Compiler
// -------------------------
const ColumnCompiler = require('../../../schema/columncompiler');

class ColumnCompiler_ClickHouse extends ColumnCompiler {
  constructor(client, tableCompiler, columnBuilder) {
    super(client, tableCompiler, columnBuilder);
  }

  // Data types
  // ClickHouse specific numeric types
  tinyint() {
    return 'Int8';
  }

  smallint() {
    return 'Int16';
  }

  mediumint() {
    return 'Int32';
  }

  integer() {
    return 'Int32';
  }

  bigint() {
    return 'Int64';
  }

  uint8() {
    return 'UInt8';
  }

  uint16() {
    return 'UInt16';
  }

  uint32() {
    return 'UInt32';
  }

  uint64() {
    return 'UInt64';
  }

  float() {
    return 'Float32';
  }

  double() {
    return 'Float64';
  }

  decimal(precision, scale) {
    return `Decimal(${precision || 10}, ${scale || 0})`;
  }

  // String types
  varchar() {
    return 'String';
  }

  string() {
    return 'String';
  }

  text() {
    return 'String';
  }

  fixedString(length) {
    return `FixedString(${length})`;
  }

  // Date and time types
  datetime(precision) {
    return precision ? `DateTime64(${precision})` : 'DateTime';
  }

  datetime64(precision) {
    return `DateTime64(${precision || 3})`;
  }

  date() {
    return 'Date';
  }

  date32() {
    return 'Date32';
  }

  // Array types
  array(type) {
    return `Array(${type})`;
  }

  // Nested types
  nested(definition) {
    return `Nested(${definition})`;
  }

  // Boolean type (implemented as UInt8)
  boolean() {
    return 'UInt8';
  }

  // UUID type
  uuid() {
    return 'UUID';
  }

  // JSON type
  json() {
    return 'String';
  }

  // Enum types
  enum(allowed) {
    const values = allowed.map((value) => {
      const [name, number] = value;
      return `'${name}' = ${number}`;
    });
    return `Enum8(${values.join(', ')})`;
  }

  // Nullable modifier
  nullable(type) {
    return `Nullable(${type})`;
  }

  // LowCardinality modifier
  lowCardinality(type) {
    return `LowCardinality(${type})`;
  }

  // Compile the column
  _compile(type, modifiers) {
    let sql = type;

    // Handle nullable modifier
    if (this.modified.nullable) {
      sql = `Nullable(${sql})`;
    }

    // Handle LowCardinality modifier
    if (this.modified.lowCardinality) {
      sql = `LowCardinality(${sql})`;
    }

    // Handle default value
    if (this.modified.defaultTo) {
      const defaultValue = this.modified.defaultTo;
      if (defaultValue === null) {
        sql += ' DEFAULT NULL';
      } else if (defaultValue === 'CURRENT_TIMESTAMP') {
        sql += ' DEFAULT CURRENT_TIMESTAMP';
      } else if (typeof defaultValue === 'boolean') {
        sql += ` DEFAULT ${defaultValue ? '1' : '0'}`;
      } else {
        sql += ` DEFAULT ${this.client.formatter.parameter(defaultValue)}`;
      }
    }

    // Handle materialized columns
    if (this.modified.materialized) {
      sql += ` MATERIALIZED ${this.modified.materialized}`;
    }

    // Handle alias columns
    if (this.modified.alias) {
      sql += ` ALIAS ${this.modified.alias}`;
    }

    // Handle column comment
    if (this.modified.comment) {
      sql += ` COMMENT '${this.modified.comment}'`;
    }

    // Handle codec
    if (this.modified.codec) {
      sql += ` CODEC(${this.modified.codec})`;
    }

    // Handle TTL
    if (this.modified.ttl) {
      sql += ` TTL ${this.modified.ttl}`;
    }

    return sql;
  }
}

module.exports = ColumnCompiler_ClickHouse;
