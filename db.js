const spicedPg = require("spiced-pg");

const db = spicedPg(`postgres:postgres:postgres@localhost:5432/petition`);

exports.register = function(first, last, email, hash) {
    return db
        .query(
            `
        INSERT INTO users (first, last, email, pass)
        VALUES ($1, $2, $3, $4)
        RETURNING first, last, id
        `,
            [first || null, last || null, email || null, hash]
        )
        .then(function(results) {
            return results.rows;
        });
};

exports.login = function(email) {
    return db
        .query(
            `
            SELECT * FROM users WHERE email = $1
        `,
            [email]
        )
        .then(function(results) {
            return results.rows;
        });
};

exports.sign = function(first, last, sig, user_id) {
    return db
        .query(
            `INSERT INTO signatures (first, last, sig, user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, first, last`,
            [first || null, last || null, sig || null, user_id || null]
        )
        .then(function(results) {
            return results.rows;
        });
};

exports.getSignature = function(id) {
    return db
        .query(
            `SELECT sig FROM signatures WHERE id = $1
        `,
            [id]
        )
        .then(function(results) {
            return results.rows;
        })
        .catch(function(err) {
            console.log(err);
        });
};

exports.getSigners = function() {
    return db
        .query(
            `SELECT first, last FROM signatures
        `
        )
        .then(function(results) {
            return results.rows;
        });
};
