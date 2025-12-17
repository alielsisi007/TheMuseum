import mongoose from "mongoose";

const PostsSchema = new mongoose.Schema({
  title: String,
  content: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
  images: [
    {
      url: String,
      public_id: String
    }
  ]
}, { timestamps: true });

export default mongoose.model('Posts',PostsSchema)