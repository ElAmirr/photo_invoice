const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const ctrl = require('../controllers/companyController');

const uploadsDir = process.env.ELECTRON_USER_DATA
    ? path.join(process.env.ELECTRON_USER_DATA, 'uploads')
    : path.join(__dirname, '../uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, `logo-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

router.get('/', ctrl.getCompany);
router.put('/', upload.single('logo'), ctrl.updateCompany);

module.exports = router;
