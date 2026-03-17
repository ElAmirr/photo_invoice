const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const ctrl = require('../controllers/companyController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
    filename: (req, file, cb) => cb(null, `logo-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

router.get('/', ctrl.getCompany);
router.put('/', upload.single('logo'), ctrl.updateCompany);

module.exports = router;
