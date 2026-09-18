const express = require('express');
const router = express.Router();
const db = require('../Database/database.js');
const verifyToken = require('../middleware/verifytoken.js');
const upload = require('../Middleware/upload.js');

router.get('/', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    db.query(
        'SELECT * FROM posts LIMIT ? OFFSET ?',
        [limit, offset],
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }

            db.query('SELECT COUNT(*) AS total FROM posts', (err, countResult) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Database error' });
                }

                const total = countResult[0].total;

                res.json({
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    posts: results
                });
            });
        }
    );
});

router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);

    db.query('SELECT * FROM posts WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'post not found' });
        }

        const post = results[0];

        db.query(
            'SELECT COUNT(*) AS likeCount FROM likes WHERE post_id = ?',
            [id],
            (err, likeResult) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Database error' });
                }

                post.likeCount = likeResult[0].likeCount;
                res.json(post);
            }
        );
    });
});

// ...GET routes stay unchanged...

router.post('/', verifyToken, upload.single('image'), (req, res) => {
    const { title, content } = req.body;
    const userId = req.user.id;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    db.query(
        'INSERT INTO posts (title, content, user_id, image_url) VALUES (?, ?, ?, ?)',
        [title, content, userId, imageUrl],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }

            res.status(201).json({
                id: result.insertId,
                title,
                content,
                user_id: userId,
                image_url: imageUrl
            });
        }
    );
});

router.put('/:id', verifyToken, upload.single('image'), (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { title, content } = req.body;

    db.query('SELECT * FROM posts WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'post not found' });
        }

        const existingPost = results[0];

        if (existingPost.user_id !== req.user.id) {
            return res.status(403).json({ error: 'You are not allowed to edit this post' });
        }

        const updatedTitle = title || existingPost.title;
        const updatedContent = content || existingPost.content;
        const updatedImageUrl = req.file ? `/uploads/${req.file.filename}` : existingPost.image_url;

        db.query(
            'UPDATE posts SET title = ?, content = ?, image_url = ? WHERE id = ?',
            [updatedTitle, updatedContent, updatedImageUrl, id],
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Database error' });
                }

                res.json({
                    id,
                    title: updatedTitle,
                    content: updatedContent,
                    image_url: updatedImageUrl
                });
            }
        );
    });
});

router.delete('/:id', verifyToken, (req, res) => {
    const id = parseInt(req.params.id, 10);

    db.query('SELECT * FROM posts WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'post not found' });
        }

        const existingPost = results[0];

        if (existingPost.user_id !== req.user.id) {
            return res.status(403).json({ error: 'You are not allowed to delete this post' });
        }

        db.query('DELETE FROM posts WHERE id = ?', [id], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }

            res.status(204).send();
        });
    });
});


router.post('/:id/like', verifyToken, (req, res) => {
    const postId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    db.query(
        'INSERT INTO likes (post_id, user_id) VALUES (?, ?)',
        [postId, userId],
        (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'You already liked this post' });
                }
                if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                    return res.status(404).json({ error: 'Post not found' });
                }
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }

            res.status(201).json({ message: 'Post liked' });
        }
    );
});

router.delete('/:id/like', verifyToken, (req, res) => {
    const postId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    db.query(
        'DELETE FROM likes WHERE post_id = ? AND user_id = ?',
        [postId, userId],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Like not found' });
            }

            res.status(204).send();
        }
    );
});


module.exports = router;