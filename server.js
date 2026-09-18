const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const commentsRouter = require('./routes/comments.js');
const usersRouter = require('./routes/users.js');
const postsRouter = require('./routes/posts.js');
const authRouter = require('./routes/auth.js');

app.get('/', (req, res) => {
    res.send('Hello, my backend is alive');
});

app.use('/posts', postsRouter);
app.use('/', authRouter);
app.use('/', commentsRouter);
app.use('/', usersRouter);

app.listen(8000, () => {
    console.log('Server running on http://localhost:8000');
});