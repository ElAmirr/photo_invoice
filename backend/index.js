require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());
const uploadsDir = process.env.ELECTRON_USER_DATA
    ? path.join(process.env.ELECTRON_USER_DATA, 'uploads')
    : path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/company', require('./routes/company'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/shootings', require('./routes/shootings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/freelancers', require('./routes/freelancers'));
app.use('/api/devis', require('./routes/devis'));
app.use('/api/factures', require('./routes/factures'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/pdf', require('./routes/pdf'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
