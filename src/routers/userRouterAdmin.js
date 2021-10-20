// 3rd party modules
const express = require('express');
// custom modules
const { getUser, getAllUsers, updateUser, deleteUser } = require('../controllers/userController');
const { protect, restrict } = require('../controllers/authController');

const router = express.Router();

router.use(protect);
router.use(restrict('admin'));

router.route('/').get(getAllUsers);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
