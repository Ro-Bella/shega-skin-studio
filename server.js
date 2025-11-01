// 1. የሚያስፈልጉ ሞጁሎች አስመጣ
require('dotenv').config(); // ከ .env ፋይል አካባቢ ተለዋዋጮችን ለመጫን
const express = require('express'); 
const mongoose = require('mongoose'); 
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const Appointment = require('./models/Appointment');
const Admin = require('./models/Admin');


const app = express();
const PORT = process.env.PORT || 3000;

// 2. ሚድልዌር አዘጋጅ
app.use(express.json()); // የ JSON መረጃ ለመቀበል
app.use(express.urlencoded({ extended: true })); // ለፎርም ዳታ
app.use(express.static(path.join(__dirname, 'public'))); // የፍሮንት-ኢንድ ፋይሎችን ለማቅረብ

// የክፍለ-ጊዜ (Session) ሚድልዌር
app.use(session({
  secret: process.env.SESSION_SECRET || 'a-very-strong-secret-key', // በ .env ፋይል ውስጥ SESSION_SECRET ያዘጋጁ
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // ለ development (HTTP) false ይጠቀሙ
}));

// አስተዳዳሪ ብቻ እንዲያልፍ የሚፈቅድ ሚድልዌር
const protect = (req, res, next) => {
  if (req.session.adminId) {
    next();
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized: Admin access only' });
  }
};

// 3. ከ MongoDB ጋር ተገናኝ
// The MONGO_URI should be in your .env file. Example: MONGO_URI=mongodb://127.0.0.1:27017/your_db_name
// Using '127.0.0.1' instead of 'localhost' can prevent issues with IPv6/IPv4 resolution.
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shega-db';
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB is Connected!'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// 4. API መንገዶች (Routes)

// 4.1. የደንበኛ መንገድ

// ሀ. ቀጠሮ ለመፍጠር (POST request) - ይሄ ለሁሉም ክፍት ነው
app.post('/api/appointments', async (req, res) => {
  try {
    const { lang } = req.body;
    const successMessage = lang === 'en' 
      ? 'Your appointment has been successfully booked!' 
      : 'ቀጠሮዎ በተሳካ ሁኔታ ተይዟል!';
    const newAppointment = new Appointment(req.body);
    await newAppointment.save();
    res.status(201).json({ success: true, message: successMessage });
  } catch (error) {
    res.status(400).json({ success: false, message: 'ቀጠሮ ለመያዝ አልተቻለም', error });
  }
});

// 4.2. የአስተዳዳሪ መንገዶች

// ሀ. አስተዳዳሪ ለመመዝገብ (ለመጀመሪያ ጊዜ ብቻ)
app.post('/api/admin/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const adminExists = await Admin.findOne({ username });
    if (adminExists) {
      return res.status(400).json({ success: false, message: 'ይህ የተጠቃሚ ስም አስቀድሞ ተይዟል' });
    }
    const admin = await Admin.create({ username, password });
    res.status(201).json({ success: true, message: 'አስተዳዳሪ በተሳካ ሁኔታ ተፈጥሯል!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'ስህተት ተፈጥሯል', error: error.message });
  }
});

// ለ. አስተዳዳሪ ለማስገባት (Login)
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      // ተጠቃሚው ካልተገኘ
      return res.status(401).json({ success: false, message: 'የተጠቃሚ ስም አልተገኘም' });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      // የይለፍ ቃል ስህተት ከሆነ
      return res.status(401).json({ success: false, message: 'የተሳሳተ የይለፍ ቃል' });
    } else {
      // ሁሉም ነገር ትክክል ከሆነ
      req.session.adminId = admin._id;
      res.json({ success: true, message: 'በተሳካ ሁኔታ ገብተዋል' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'ስህተት ተፈጥሯል', error: error.message });
  }
});

// ሐ. አስተዳዳሪን ለማስወጣት (Logout)
app.get('/api/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/admin-dashboard.html');
    }
    res.clearCookie('connect.sid');
    res.redirect('/admin-login.html');
  });
});

// መ. ሁሉንም ቀጠሮዎች ለአስተዳዳሪ ለማግኘት (GET request)
// `protect` ሚድልዌርን እዚህ እንጠቀማለን
app.get('/api/admin/appointments', protect, async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ success: false, message: 'ቀጠሮዎችን ለማምጣት አልተቻለም', error });
  }
});

// ሠ. አንድን ቀጠሮ ለመሰረዝ (DELETE request) - ለአስተዳዳሪ ብቻ
app.delete('/api/admin/appointments/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (appointment) {
      await appointment.deleteOne(); // Mongoose v6+ uses deleteOne()
      res.json({ success: true, message: 'ቀጠሮው በተሳካ ሁኔታ ተሰርዟል' });
    } else {
      res.status(404).json({ success: false, message: 'ቀጠሮው አልተገኘም' });
    }
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ success: false, message: 'ቀጠሮውን ለመሰረዝ አልተቻለም', error });
  }
});

// ረ. የአስተዳዳሪን የተጠቃሚ ስም እና የይለፍ ቃል ለማዘመን (PUT request)
app.put('/api/admin/profile', protect, async (req, res) => {
  try {
    const admin = await Admin.findById(req.session.adminId);

    if (admin) {
      const { username, password } = req.body;
      
      // የተጠቃሚ ስም ከተሰጠ እና አዲስ ከሆነ እናዘምነዋለን
      if (username && username !== admin.username) {
        admin.username = username;
      }

      // አዲስ የይለፍ ቃል ከተሰጠ እናዘምነዋለን
      if (password) {
        admin.password = password; // የይለፍ ቃል በ 'pre-save' hook በራስ-ሰር hash ይደረጋል
      }

      await admin.save();
      res.json({ success: true, message: 'የአስተዳዳሪው መረጃ በተሳካ ሁኔታ ተዘምኗል' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'መረጃውን ለማዘመን አልተቻለም', error: error.message });
  }
});

// 4.3. ዋና ገጽ መንገድ
// ተጠቃሚው ወደ root ሲሄድ የቋንቋ መምረጫውን ያሳዩ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// 5. ሰርቨሩን ጀምር
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to select a language.`);
  console.log(`Main Page: http://localhost:${PORT}/landing.html`);
});