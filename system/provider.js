const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

class Local {
  data = {};
  file = path.join(process.cwd(), process.env.DATABASE_NAME + ".json");

  read() {
    let data;
    if (fs.existsSync(this.file)) {
      data = JSON.parse(fs.readFileSync(this.file));
    } else {
      fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
      data = this.data;
    }
    return data;
  }

  write(data) {
    this.data = data;
    let dirname = path.dirname(this.file);
    if (!fs.existsSync(dirname)) fs.mkdirSync(dirname, { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
    return this.file;
  }
}

class PostgreSQL {
  constructor(config, tableName) {
    this.config = config;
    this.tableName = tableName;
    this.pool = null;
    this.isClosing = false;
  }

  async connect(forceReconnect = false) {
    if ((forceReconnect || !this.pool) && !this.isClosing) {
      try {
        this.pool = new Pool(this.config);

        const client = await this.pool.connect();
        client.release();

        await this.createTable();
      } catch (error) {
        console.error("PostgreSQL connection error:", error);
        throw error;
      }
    }
  }

  async createTable() {
    if (this.isClosing || !this.pool) return;

    const query = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id SERIAL PRIMARY KEY,
        data JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
      await this.pool.query(query);
    } catch (error) {
      console.error("Error creating table:", error);
      throw error;
    }
  }

  async read() {
    if (this.isClosing) {
      console.warn("Cannot read: PostgreSQL pool is closing");
      return {};
    }

    if (!this.pool) await this.connect();

    try {
      const query = `SELECT data FROM ${this.tableName} ORDER BY id LIMIT 1`;
      const result = await this.pool.query(query);

      if (result.rows.length === 0) {
        const insertQuery = `INSERT INTO ${this.tableName} (data) VALUES ($1) RETURNING data`;
        const insertResult = await this.pool.query(insertQuery, [
          JSON.stringify({}),
        ]);
        return insertResult.rows[0].data;
      }

      return result.rows[0].data;
    } catch (error) {
      if (error.message.includes("pool after calling end")) {
        console.warn("Pool was closed, reconnecting...");
        await this.connect(true);
        return this.read();
      }
      console.error("Error reading data from PostgreSQL:", error);
      throw error;
    }
  }

  async write(data) {
    if (this.isClosing) {
      console.warn("Cannot write: PostgreSQL pool is closing");
      return;
    }

    if (!this.pool) await this.connect();

    try {
      const jsonData = JSON.stringify(data || {});

      const checkQuery = `SELECT id FROM ${this.tableName} ORDER BY id LIMIT 1`;
      const checkResult = await this.pool.query(checkQuery);

      if (checkResult.rows.length > 0) {
        const updateQuery = `
          UPDATE ${this.tableName} 
          SET data = $1, updated_at = CURRENT_TIMESTAMP 
          WHERE id = $2
        `;
        await this.pool.query(updateQuery, [jsonData, checkResult.rows[0].id]);
      } else {
        const insertQuery = `INSERT INTO ${this.tableName} (data) VALUES ($1)`;
        await this.pool.query(insertQuery, [jsonData]);
      }
    } catch (error) {
      if (error.message.includes("pool after calling end")) {
        console.warn("Pool was closed, reconnecting...");
        await this.connect(true);
        return this.write(data);
      }
      console.error("Error writing data to PostgreSQL:", error);
      throw error;
    }
  }

  async close() {
    if (this.pool && !this.isClosing) {
      this.isClosing = true;
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await this.pool.end();
        this.pool = null;
        console.log("Disconnected from PostgreSQL");
      } catch (error) {
        console.error("Error disconnecting from PostgreSQL:", error);
        throw error;
      }
    }
  }
}

module.exports = { Local, PostgreSQL };
