module.exports = {
  development: {
    username: process.env.DB_USER || 'myuser',
    password: process.env.DB_PASSWORD || 'mypass',
    database: process.env.DB_NAME || 'divar_crawler_db',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 20,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    username: process.env.DB_USER || 'myuser',
    password: process.env.DB_PASSWORD || 'mypass',
    database: process.env.DB_NAME || 'divar_crawler_db_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    username: process.env.DB_USER || 'myuser',
    password: process.env.DB_PASSWORD || 'mypass',
    database: process.env.DB_NAME || 'divar_crawler_db',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 20,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};
