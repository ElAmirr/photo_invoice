const router = require('express').Router();
const ctrl = require('../controllers/pdfController');

router.get('/devis/:id', ctrl.generateDevisPdf);
router.get('/factures/:id', ctrl.generateFacturePdf);

module.exports = router;
