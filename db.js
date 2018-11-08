const spicedPg = require("spiced-pg");

const db = spicedPg(`postgres:postgres:postgres@localhost:5432/petition`);

exports.sign = function(first, last, sig) {
    return db
        .query(
            `INSERT INTO signatures (first, last, sig)
        VALUES ($1, $2, $3)
        RETURNING *`,
            [first, last, sig]
        )
        .then(function(results) {
            return results.rows;
        });
};
