"use strict";
const { getComments } = require("../lib/Database.js");
const argon2 = require("argon2");
const url = require("url");

/**
 * This isn't necessarily sensitive data...... but I also don't want just anybody to be able
 * to see what comments were submitted to this blog. So let's just have a simple layer of
 * safety.
 */
const handleCommentHistoryGet = async (req, res) => {
    const parsedURL = url.parse(req.url, true);
    // Maybe responding with 404 will make spammers think that nothing is here?
    // I feel like if I respond with a 401 people will try to brute force this,
    // increasing server load on my tiny digital ocean droplet.
    // ¯\_(ツ)_/¯
    if (!parsedURL?.query?.token) {
        res.status(404).send();
        return;
    }

    let match = false;
    try {
        match = await argon2.verify(
            process.env.STATICMAN_KEY_HASH,
            parsedURL.query.token
        );
    } catch (err) {
        console.error(err);
        res.status(404).send();
        return;
    }

    if (!match) {
        res.status(404).send();
        return;
    }

    let comments;
    try {
        comments = await getComments();
    } catch (e) {
        console.error(e);
        res.status(500).send("Woops, something went wrong.");
        return;
    }
    res.send(JSON.stringify(comments));
};

module.exports = {
    handleCommentHistoryGet,
};
