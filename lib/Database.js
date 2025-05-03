/**
 * We need a way to store off the comments that Akismet approved or disapproved, so we can
 * see if Akismet's model made the correction decision. The only thing we are storing here
 * is the user's comment, and nothing else about the user, so we should be fine here.
 */

const sqlite3 = require('sqlite3').verbose();
const createCommentsTableSQL = `
CREATE TABLE IF NOT EXISTS comments (
    id integer PRIMARY KEY NOT NULL,
    site text NOT NULL,
    permalink text NOT NULL,
    comment_type text NOT NULL,
    comment_content text NOT NULL,
    is_spam integer NOT NULL 
);`

const initialiseDB = () => {
    const db = new sqlite3.Database('akismet');
    db.run(createCommentsTableSQL);
    return db;
}

const db = initialiseDB();

const insertCommentSQL = `
INSERT INTO comments(site, permalink, comment_type, comment_content, is_spam)
VALUES(?, ?, ?, ?, ?)`

const insertSpamComment = (comment) => {
    db.run(insertCommentSQL, [
        comment.site,
        comment.permalink,
        comment.comment_type, 
        comment.comment_content,
        1
    ], (err) => {
        if (err) console.log(err);
    });
}

const insertGoodComment = (comment) => {
    const result = db.run(insertCommentSQL, [
        comment.site,
        comment.permalink,
        comment.comment_type, 
        comment.comment_content,
        0
    ], (err) => {
        if (err) console.log(err);
    });
}

const getCommentsSQL = `SELECT id, site, permalink, comment_type, comment_content, is_spam FROM comments`;
const getComments = () => {
   return new Promise((resolve, reject) => {
      db.all(getCommentsSQL, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    }); 
}

module.exports = {
    insertSpamComment,
    insertGoodComment,
    getComments
}
