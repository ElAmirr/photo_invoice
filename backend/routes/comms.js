const express = require('express');
const router = express.Router();
const commsController = require('../controllers/commsController');

router.get('/settings', commsController.getSettings);
router.post('/settings/smtp', commsController.saveSmtp);
router.post('/settings/smtp/test', commsController.testSmtp);
router.post('/settings/template', commsController.saveTemplate);
router.post('/send-email', commsController.sendEmail);
router.get('/logs', commsController.getLogs);

module.exports = router;
