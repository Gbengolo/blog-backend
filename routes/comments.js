const express = require('express');
const router = express.Router();
const db = require('../Database/database.js');
const verifyToken = require('../Middleware/verifytoken.js');

router.get('/posts/:postId/comments', (req, res) => {
    const postId = parseInt(req.params.postId, 10);

    db.query(
        'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC',
        [postId],
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(results);
        }
    );
});

router.post('/posts/:postId/comments', verifyToken, (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    db.query(
        'INSERT INTO comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, NOW())',
        [postId, userId, content],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }

            res.status(201).json({
                id: result.insertId,
                post_id: postId,
                user_id: userId,
                content
            });
        }
    );
});

router.delete('/posts/:postId/comments/:commentId', verifyToken, (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const commentId = parseInt(req.params.commentId, 10);

    db.query(
        'SELECT * FROM comments WHERE id = ? AND post_id = ?',
        [commentId, postId],
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Comment not found' });
            }

            const comment = results[0];
            if (comment.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Unauthorized to delete this comment' });
            }

            db.query(
                'DELETE FROM comments WHERE id = ?',
                [commentId],
                (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: 'Database error' });
                    }

                    res.json({ message: 'Comment deleted successfully' });
                }
            );
        }
    );
});

module.exports = router;