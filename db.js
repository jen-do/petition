const spicedPg = require("spiced-pg");

var db = spicedPg(
    process.env.DATABASE_URL ||
        `postgres:postgres:postgres@localhost:5432/petition`
);

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

exports.addInfo = function(age, city, url, user_id) {
    return db
        .query(
            `INSERT INTO user_profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING age, city, url`,
            [age || null, city || null, url || null, user_id || null]
        )
        .then(function(results) {
            return results.rows;
        });
};

exports.getProfile = function(user_id) {
    return db
        .query(
            `
        SELECT users.id, users.first, users.last, users.email, user_profiles.age, user_profiles.city, user_profiles.url
        FROM users
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE user_profiles.user_id = $1`,
            [user_id]
        )
        .then(function(results) {
            return results.rows;
        });
};

exports.updateUser = function(id, first, last, email) {
    return db
        .query(
            `
        UPDATE users
        SET first = $2, last = $3, email = $4
        WHERE id = $1

        `,
            [id, first, last, email]
        )
        .then(function(results) {
            return results.rows;
        });
};

exports.updateUserAndPassword = function(id, first, last, email, hash) {
    return db
        .query(
            `
        UPDATE users
        SET first = $2, last = $3, email = $4, pass = $5
        WHERE id = $1

        `,
            [id, first, last, email, hash]
        )
        .then(function(results) {
            return results.rows;
        });
};

exports.updateUserProfile = function(age, city, url, user_id) {
    console.log("db.updateuserprofile");
    return db
        .query(
            `
        INSERT INTO user_profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET age = $1, city = $2, url = $3
        `,
            [age || null, city, url, user_id]
        )
        .then(function(results) {
            return results.rows;
        });
};

exports.login = function(email) {
    return db
        .query(
            `
            SELECT signatures.id AS signatures_id, users.id AS user_id, users.first, users.last, users.pass
            FROM signatures
            FULL OUTER JOIN users
            ON users.id = signatures.user_id
            WHERE email = $1
        `,
            [email]
        )
        .then(function(results) {
            return results.rows;
        });
};

exports.sign = function(sig, user_id) {
    return db
        .query(
            `INSERT INTO signatures (sig, user_id)
        VALUES ($1, $2)
        RETURNING id, user_id`,
            [sig || null, user_id || null]
        )
        .then(function(results) {
            return results.rows;
        });
};

exports.countSigners = function() {
    return db.query(`SELECT COUNT(id) FROM signatures`).then(function(results) {
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
            `SELECT first, last, age, city, url
            FROM signatures
            LEFT JOIN user_profiles
            ON user_profiles.user_id = signatures.user_id
            LEFT JOIN users
            ON users.id = signatures.user_id
        `
        )
        .then(function(results) {
            return results.rows;
        });
};

exports.getSignersbyCity = function(city) {
    return db
        .query(
            `
        SELECT first, last, age, city, url
        FROM signatures
        LEFT JOIN user_profiles
        ON user_profiles.user_id = signatures.user_id
        LEFT JOIN users
        ON users.id = signatures.user_id
        WHERE LOWER(city) = LOWER($1)`,
            [city]
        )
        .then(function(results) {
            return results.rows;
        });
};

exports.deleteSignature = function(user_id) {
    return db
        .query(
            `
            DELETE FROM signatures
            WHERE user_id = $1
            `,
            [user_id]
        )
        .then(function() {
            return;
        });
};

exports.deleteUserProfile = function(user_id) {
    return db
        .query(
            `
            DELETE FROM user_profiles
            WHERE user_id = $1
            `,
            [user_id]
        )
        .then(function() {
            return;
        });
};

exports.deleteUser = function(id) {
    return db
        .query(
            `
            DELETE FROM users
            WHERE id = $1
            `,
            [id]
        )
        .then(function() {
            return;
        });
};
