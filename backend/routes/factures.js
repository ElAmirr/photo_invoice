const router = require('express').Router();
const ctrl = require('../controllers/facturesController');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.patch('/:id/status', ctrl.updateStatus);

module.exports = router;
