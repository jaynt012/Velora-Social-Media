const express = require('express');
const router = express.Router();
const postsController = require('../controllers/posts.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../../backend/uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.get('/',             verifyToken, postsController.getFeed);
router.post('/',            verifyToken, upload.single('image'), postsController.createPost);
router.delete('/:id',       verifyToken, postsController.deletePost);
router.post('/:id/like',    verifyToken, postsController.likePost);
router.post('/:id/unlike',  verifyToken, postsController.unlikePost);
router.get('/:id/comments', verifyToken, postsController.getComments);
router.post('/:id/comments',verifyToken, postsController.addComment);

module.exports = router;
