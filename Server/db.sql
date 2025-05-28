-- Create DB first
CREATE DATABASE quizdb;

-- Then create tables manually
\c quizdb;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  score INT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
