var express = require('express');
var router = express.Router();

/***
 *  USER REGISTER
 * */
router.post('/registerUser', (req,res) => {
  userController.registerUser(req,res);
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Marketplace' });
});

module.exports = router;