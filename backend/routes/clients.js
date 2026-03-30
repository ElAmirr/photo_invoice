const router = require('express').Router();
const ctrl = require('../controllers/clientsController');

router.get('/', ctrl.getAll);
router.get('/:id/analytics', ctrl.getAnalytics);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
