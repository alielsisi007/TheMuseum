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
    // support pagination and simple search
    const { page = 1, limit = 20, search } = req.query;
    const q = {};
    if (search) {
      q.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    let posts;
    try {
      posts = await PostsSchema.find(q).populate('user', 'userName email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    } catch (popErr) {
      console.warn('Populate failed, falling back to non-populated posts:', popErr && popErr.message);
      // If populate fails (e.g., MissingSchemaError on deployed env), fetch without populate to avoid 500
      posts = await PostsSchema.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    }

    // map posts to frontend-friendly exhibit shape
    const exhibits = posts.map(p => ({
      _id: p._id,
      name: p.title,
      description: p.content,
      images: p.images || [],
      image: p.images && p.images.length ? p.images[0].url : null,
      location: p.location || null,
      duration: p.duration || null,
      category: p.category || null,
      user: p.user,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    const total = await PostsSchema.countDocuments(q);
    return res.json({ exhibits, total, page: Number(page) });
  } catch (err) {
    console.error('Get Posts Error:', err);
    // Return limited error info for debugging (remove before production)
    const msg = err && err.message ? err.message : 'Server error';
    const stackPreview = err && err.stack ? err.stack.split('\n').slice(0,5) : [];
    return res.status(500).json({ message: 'Server error', error: msg, stack: stackPreview });
  }
};

// Get single post by id (public)
export const getPostById = async (req, res) => {
  try {
    let post;
    try {
      post = await PostsSchema.findById(req.params.id).populate('user', 'userName email');
    } catch (popErr) {
      console.warn('Populate failed for single post, falling back to non-populated post:', popErr && popErr.message);
      post = await PostsSchema.findById(req.params.id);
    }
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const exhibit = {
      _id: post._id,
      name: post.title,
      description: post.content,
      images: post.images || [],
      image: post.images && post.images.length ? post.images[0].url : null,
      location: post.location || null,
      duration: post.duration || null,
      category: post.category || null,
      user: post.user,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
    return res.json({ exhibit });
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

    // حذف الصور من Cloudinary (إن وُجدت)
    if (post.images && post.images.length > 0) {
      for (let img of post.images) {
        if (img.public_id) {
          try {
            await cloudinary.uploader.destroy(img.public_id);
          } catch (e) {
            console.warn('Failed to delete cloudinary image', img.public_id, e.message);
          }
        }
      }
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
