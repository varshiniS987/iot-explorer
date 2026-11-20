import mongoose from 'mongoose';

export default mongoose.model('MailOutbox', new mongoose.Schema({
  to: String, subject: String, body: String,
  status: { type: String, enum: ['sent', 'simulated', 'failed'] },
}, { timestamps: true }));
