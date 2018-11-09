DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first VARCHAR(50) NOT NULL,
    last VARCHAR(50) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE CHECK (email <>''),
    pass VARCHAR(200) NOT NULL
);
