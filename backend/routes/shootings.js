const router = require('express').Router();
const ctrl = require('../controllers/shootingsController');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

// Freelancer assignment
router.post('/:id/freelancers', ctrl.assignFreelancer);
router.delete('/:id/freelancers/:freelancerId', ctrl.removeFreelancer);
router.patch('/:id/freelancers/:freelancerId', ctrl.updateFreelancerPayment);

module.exports = router;
