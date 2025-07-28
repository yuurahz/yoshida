const fs = require("fs");
const { Pool } = require("pg");

class Local {
  /**
   * Initializes the LocalDB instance with the provided file path.
   * @param {string} [filePath] - The path to the JSON file where the database will be stored. Defaults to 'database.json'.
   */
  constructor(filePath) {
    this.filePath = filePath ? filePath + ".json" : process.env.DATABASE_NAME;
    this.queue = [];
    this.initDB();
  }

  /**
   * Initializes the database by checking if the file exists.
   * If the file does not exist, it creates an empty JSON file.
   * @returns {Promise<void>}
   */
  initDB = async () => {
    try {
      await fs.access(this.filePath);
    } catch (err) {
      await this.write({});
    }
  };

  /**
   * Validates if the provided data is a valid JSON object.
   * @param {any} data - The data to be validated.
   * @returns {boolean} - Returns true if the data is valid JSON, otherwise false.
   */
  validateJSON = (data) => {
    try {
      JSON.stringify(data, null);
      return true;
    } catch (err) {
      return false;
    }
  };

  /**
   * Adds data to the internal queue to be saved later.
   * @param {object} data - The data to be added to the queue.
   */
  enqueue = (data) => this.queue.push(data);

  /**
   * Write the valid data from the queue to the file.
   * If the data is valid JSON, it will be written to the file.
   * @param {object} data - The data to be saved to the file.
   * @returns {Promise<void>}
   */
  write = async (data) => {
    this.enqueue(data);

    const validData = this.queue.filter(this.validateJSON);
    this.queue = [];

    if (validData.length > 0) {
      try {
        await fs.writeFile(
          this.filePath,
          JSON.stringify(validData[0], null),
          "utf8",
        );
      } catch (err) {
        console.log(`Failed to save data: ${err.message}`);
      }
    } else {
      console.log("No valid data to save");
    }
  };

  /**
   * Read the data from the JSON file and returns it.
   * @returns {Promise<object|null>} - The parsed data from the file, or null if an error occurred.
   */
  read = async () => {
    try {
      const data = await fs.readFile(this.filePath, "utf8");
      return JSON.parse(data);
    } catch (err) {
      console.log(`Failed to fetch data: ${err.message}`);
      return null;
    }
  };
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
