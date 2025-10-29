const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// የአስተዳዳሪ ስኬማ
const AdminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'እባክዎ የተጠቃሚ ስም ያስገቡ'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'እባክዎ የይለፍ ቃል ያስገቡ']
  }
});

// የይለፍ ቃልን ከማስቀመጣችን በፊት ሃሽ እናድርገው
AdminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// የይለፍ ቃል ማነፃፀሪያ ፈንክሽን
AdminSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Admin', AdminSchema);