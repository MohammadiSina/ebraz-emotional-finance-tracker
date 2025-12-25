import * as Joi from 'joi';

export enum NodeEnv {
  DEV = 'development',
  PRD = 'production',
}

// Generic LLM model enum (supports multiple providers)
export enum AIModel {
  // OpenAI models
  GPT_4O_MINI = 'gpt-4o-mini',

  // Add other provider models as needed
}

const ERROR_MESSAGES = {
  REQUIRED_DATABASE_URL: `Missing required DATABASE_URL. Must be a valid SQL database URI (mysql://, postgres://, etc.)`,
  REQUIRED_OPENAI_API_KEY: `OPENAI_API_KEY required when using OpenAI models (${Object.values(AIModel)
    .filter((m) => m.startsWith('gpt'))
    .join(', ')})`,
  PATTERN_DATABASE_URL: `Invalid database scheme. Supported schemes: mysql, postgres, mariadb, mssql, oracle, sqlite`,
};

export const envValidationSchema = Joi.object({
  // Core app config
  NODE_ENV: Joi.string()
    .valid(...Object.values(NodeEnv))
    .default(NodeEnv.DEV)
    .description('Runtime environment')
    .example('production')
    .required(),

  PORT: Joi.number().port().default(3000).description('HTTP server port').example(3000).required(),

  // Flexible SQL database validation (MySQL, PostgreSQL, MariaDB, etc.)
  DATABASE_URL: Joi.string()
    .uri({
      scheme: [
        /^mysql2?/i, // mysql, mysql2
        /^postgres(?:ql)?/i, // postgres, postgresql
        /^mariadb/i, // mariadb
        /^mssql/i, // Microsoft SQL Server
        /^sqlserver/i, // SQL Server alternative scheme
        /^oracle/i, // Oracle DB
        /^sqlite/i, // SQLite (file-based)
      ],
    })
    .required()
    .description('SQL database connection URL (MySQL/PostgreSQL/MariaDB/SQL Server/Oracle/SQLite)')
    .example('mysql://user:pass@localhost:3306/dbname')
    .example('postgres://user:pass@localhost:5432/dbname')
    .example('sqlite:///path/to/database.sqlite'),

  // Redis config
  REDIS_URL: Joi.string()
    .uri({ scheme: [/^rediss?/i] })
    .required()
    .description('Redis connection URL')
    .example('redis://localhost:6379'),

  REDIS_CACHE_TTL: Joi.number()
    .integer()
    .min(1)
    .max(2_592_000_000) // 30 days in ms
    .required()
    .description('Cache TTL in milliseconds')
    .example(900_000), // 15 minutes

  // Authentication config
  JWT_SECRET: Joi.string()
    .min(32)
    .regex(/^[a-zA-Z0-9+/=]{32,}$/)
    .required()
    .description('Base64-encoded JWT secret (min 32 raw bytes)')
    .example('VGhpcyBpcyBhIHNlY3VyZSBzZWNyZXQ='),

  JWT_EXPIRES_IN: Joi.string()
    .regex(/^(\d+)(ms|s|m|h|d|w|M|y)$/)
    .required()
    .description('Token expiration duration (e.g., "2h", "30m")')
    .example('2h'),

  // LLM configuration (provider-agnostic validation)
  OPENAI_API_KEY: Joi.string()
    .pattern(/^sk-[a-zA-Z0-9]/)
    .required()
    .description('OpenAI API key (required only if using OpenAI models)')
    .example('sk-proj_ABCDEFGHIJKLMNOPQRST'),

  OPENAI_MODEL: Joi.string()
    .valid(...Object.values(AIModel))
    .required()
    .description('LLM model identifier (supports multiple providers)')
    .example(AIModel.GPT_4O_MINI),
})
  // Global security settings
  .options({
    abortEarly: false,
    presence: 'required',
    stripUnknown: true,
  });
