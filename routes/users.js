const express = require('express');
const router = express.Router();
const db = require('../Database/database.js');
const verifyToken = require('../middleware/verifytoken.js');
const upload = require('../middleware/upload.js');

router.get('/me', verifyToken, (req, res) => {
    const userId = req.user.id;

    db.query(
        'SELECT id, username, bio, profile_picture FROM users WHERE id = ?',
        [userId],
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json(results[0]);
        }
    );
});

router.get('/users/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);

    db.query(
        'SELECT id, username, bio, profile_picture FROM users WHERE id = ?',
        [id],
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json(results[0]);
        }
    );
});

router.put('/me', verifyToken, upload.single('profile_picture'), (req, res) => {
    const userId = req.user.id;
    const { bio } = req.body;

    db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }

        const existingUser = results[0];
        const updatedBio = bio || existingUser.bio;
        const updatedPicture = req.file ? `/uploads/${req.file.filename}` : existingUser.profile_picture;

        db.query(
            'UPDATE users SET bio = ?, profile_picture = ? WHERE id = ?',
            [updatedBio, updatedPicture, userId],
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Database error' });
                }

                res.json({
                    id: userId,
                    username: existingUser.username,
                    bio: updatedBio,
                    profile_picture: updatedPicture
                });
            }
        );
    });
});

module.exports = router;