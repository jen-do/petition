-- DROP TABLE signatures;

DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    sig TEXT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id)
);
