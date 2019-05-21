var express = require('express');
var router = express.Router();
const userController = require('../controller/users_controller');
const jwt = require('../utils/jwt');

router.post('/add_authority', function(req, res) {
  userController.addAuthority(req,res);
});
router.post('/registerUser', (req,res) => {
  userController.registerUser(req,res);
});
router.get('/confirm/:token',(req,res) => {
  userController.userActivation(req,res)
});
router.post('/login', userController.login);
router.post('/add_number', jwt.validateUserToken, userController.addNumber);
router.post('/varify_number', jwt.validateUserToken, userController.varifyNumber);
router.post('/resend_token', jwt.validateUserToken, userController.resendToken);
router.post('/reset_password', (req,res) => {
  userController.resetPassword(req,res);
});
router.get('/reset/:token',(req,res) => {
  userController.reset(req,res);
});
router.post('/reset',(req,res) => {
  userController.completeReset(req,res);
});
router.post('/add_profile_image', jwt.validateUserToken, userController.addProfileImage);
router.post('/add_company_uen', jwt.validateUserToken, userController.addCompanyUEN);
router.get('/getUser', jwt.validateUserToken, userController.getUser);
router.post('/update_user', jwt.validateUserToken, userController.updateUser);
router.post('/update_number', jwt.validateUserToken, userController.updateNumber);
router.post('/update_password', jwt.validateUserToken, userController.updatePassword);

module.exports = router;