import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    parts: { type: Array, required: true },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    _id: { type: String }, // use the client-generated UUID directly
    userId: { type: String, index: true },
    title: { type: String, default: 'New chat' },
    messages: [messageSchema],
  },
  { timestamps: true, _id: false } // _id: false stops Mongoose auto-generating an ObjectId
);

export default mongoose.model('Conversation', conversationSchema);