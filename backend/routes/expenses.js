const express = require('express');
const router = express.Router();
const expensesController = require('../controllers/expensesController');

router.get('/', expensesController.getAll);
router.post('/', expensesController.create);
router.put('/:id', expensesController.update);
router.delete('/:id', expensesController.delete);

router.get('/categories', expensesController.getAllCategories);
router.post('/categories', expensesController.createCategory);
router.put('/categories/:id', expensesController.updateCategory);
router.delete('/categories/:id', expensesController.deleteCategory);

module.exports = router;
