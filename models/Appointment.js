const mongoose = require('mongoose');

// የ ቀጠሮ ማስያዣ ስኬማ
const AppointmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String, 
    required: true
  },
  time: {
    type: String, 
    required: true
  },
   service: {
    type: String, 
    default: true 
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);