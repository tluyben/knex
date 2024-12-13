// ClickHouse Query Compiler
// -------------------------
const QueryCompiler = require('../../../query/querycompiler');
const { isString } = require('../../../util/is');

class QueryCompiler_ClickHouse extends QueryCompiler {
  constructor(client, builder, formatter) {
    super(client, builder, formatter);
  }

  // ClickHouse specific SELECT query modifications
  select() {
    let sql = super.select();

    const { options } = this;

    // Handle ClickHouse specific options
    if (options && options.final) {
      sql += ' FINAL';
    }

    if (options && options.sampleSize) {
      sql += ` SAMPLE ${this.formatter.parameter(options.sampleSize)}`;
    }

    return sql;
  }

  // ClickHouse doesn't support UPDATE with JOIN
  update() {
    const updateData = this._prepUpdate(this.single.update);
    const wheres = this.where();
    return `ALTER TABLE ${this.tableName()} UPDATE ${updateData.join(
      ', '
    )} WHERE ${wheres}`;
  }

  // ClickHouse specific INSERT modifications
  insert() {
    const sql = super.insert();
    const { options } = this;

    // Handle ClickHouse specific INSERT options
    if (options && options.distributed) {
      return sql.replace(
        /^INSERT/,
        'INSERT INTO DISTRIBUTED CLUSTER'
      );
    }

    return sql;
  }

  // ClickHouse doesn't support traditional DELETE
  del() {
    const wheres = this.where();
    return `ALTER TABLE ${this.tableName()} DELETE WHERE ${wheres}`;
  }

  // Compiles a truncate query
  truncate() {
    return `TRUNCATE TABLE ${this.tableName()}`;
  }

  // Handle ClickHouse specific aggregations
  aggregate(stmt) {
    const val = stmt.value;
    const distinct = stmt.distinct ? 'DISTINCT ' : '';
    const type = stmt.type;

    if (type === 'uniqHLL') {
      return `uniqHLL12(${distinct}${this.formatter.wrap(val)})`;
    }

    if (type === 'countIf') {
      return `countIf(${distinct}${this.formatter.wrap(val)})`;
    }

    return super.aggregate(stmt);
  }

  // ClickHouse specific GROUP BY modifications
  groupBy() {
    let sql = super.groupBy();
    const { options } = this;

    // Handle ClickHouse specific GROUP BY options
    if (options && options.withTotals) {
      sql += ' WITH TOTALS';
    }

    return sql;
  }

  // Compile ClickHouse specific JOIN types
  joinType(type) {
    switch (type) {
      case 'GLOBAL':
        return 'GLOBAL ALL';
      case 'GLOBAL ANY':
        return 'GLOBAL ANY';
      case 'ALL':
        return 'ALL';
      case 'ANY':
        return 'ANY';
      default:
        return super.joinType(type);
    }
  }

  // Handle ClickHouse specific table functions
  tableName() {
    const tableName = super.tableName();
    const { options } = this;

    if (options && options.tableFunction) {
      return `${options.tableFunction}(${tableName})`;
    }

    return tableName;
  }

  // ClickHouse specific LIMIT BY clause
  _limitBy(stmt) {
    const { value, by } = stmt;
    return `LIMIT ${this.formatter.parameter(value)} BY ${this.formatter.columnize(
      by
    )}`;
  }

  // Override the standard LIMIT to handle ClickHouse's syntax
  limit() {
    const noOffset = !this.single.offset;
    const clause = [];

    if (this.single.limit) {
      clause.push(
        `LIMIT ${
          noOffset ? this.formatter.parameter(this.single.limit)
          : `${this.formatter.parameter(this.single.offset)}, ${
              this.formatter.parameter(this.single.limit)
            }`
        }`
      );
    }

    return clause.length > 0 ? clause.join(' ') : '';
  }
}

module.exports = QueryCompiler_ClickHouse;
