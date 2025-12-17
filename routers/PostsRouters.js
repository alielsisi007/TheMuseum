import PostsSchema from "../model/PostsSchema.js";
import UsersSchema from "../model/UsersSchema.js";
import { verifyToken } from "../auth/TokenCreater.js";
import { isAdmin } from "../auth/auth.js";
import cloudinary from "../config/cloudinary.js";

// create posts (Admin Only)
export const CreatePosts = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = verifyToken(token);
    const user = await UsersSchema.findById(decoded.id);
    if (!user || !isAdmin(user)) return res.status(403).json({ message: "Admins only" });

    const { title, content } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Images are required" });
    }

    // هنا بننتظر الصور وتتأكد إنها موجودة
    const images = req.files.map(file => ({
      url: file.path,      // Cloudinary URL
      public_id: file.filename
    }));

    const post = await PostsSchema.create({
      title,
      content,
      images,
      user: user._id
    });

    return res.status(201).json({ message: "Post created successfully", post });
  } catch (err) {
    console.error("Create Post Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get all posts (public)
export const getAllPosts = async (req, res) => {
  try {
    const posts = await PostsSchema.find().populate('user', 'userName email').sort({ createdAt: -1 });
    return res.json(posts);
  } catch (err) {
    console.error('Get Posts Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get single post by id (public)
export const getPostById = async (req, res) => {
  try {
    const post = await PostsSchema.findById(req.params.id).populate('user', 'userName email');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    return res.json(post);
  } catch (err) {
    console.error('Get Post Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


    
// delet Posts (Admin Only)

export const DeletePosts = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = verifyToken(token);
    const user = await UsersSchema.findById(decoded.id);

    if (!user || !isAdmin(user)) {
      return res.status(403).json({ message: "Admins only" });
    }

    const post = await PostsSchema.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // حذف الصورة من Cloudinary
    if (post.image?.public_id) {
      await cloudinary.uploader.destroy(post.image.public_id);
    }

    await post.deleteOne();

    return res.json({ message: "Post deleted successfully" });

  } catch (err) {
    console.error("Delete Post Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Update Post (Admin Only)
export const UpdatePost = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = verifyToken(token);
    const user = await UsersSchema.findById(decoded.id);

    if (!user || !isAdmin(user)) {
      return res.status(403).json({ message: "Admins only" });
    }

    const post = await PostsSchema.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const { title, content } = req.body;

    if (title) post.title = title;
    if (content) post.content = content;

    // التعامل مع الصور سواء واحدة أو أكثر
    const newFiles = req.files?.length ? req.files : req.file ? [req.file] : [];

    if (newFiles.length > 0) {
      // مسح الصور القديمة
      if (post.images && post.images.length > 0) {
        for (let img of post.images) {
          await cloudinary.uploader.destroy(img.public_id);
        }
      }

      // إضافة الصور الجديدة
      post.images = newFiles.map(file => ({
        url: file.path,      // Cloudinary URL
        public_id: file.filename
      }));
    }

    await post.save();

    return res.json({
      message: "Post updated successfully",
      post
    });

  } catch (err) {
    console.error("Update Post Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
