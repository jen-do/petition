const spicedPg = require("spiced-pg");

const db = spicedPg(`postgres:postgres:postgres@localhost:5432/petition`);

exports.sign = function(first, last, sig) {
    return db
        .query(
            `INSERT INTO signatures (first, last, sig)
        VALUES ($1, $2, $3)
        RETURNING id, first, last`,
            [first || null, last || null, sig || null]
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
