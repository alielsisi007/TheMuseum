import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcrypt';
import UsersSchema from './model/UsersSchema.js';
import { createToken, verifyToken } from './auth/TokenCreater.js';
import cookieParser from 'cookie-parser';
import { deleteUserAccount, getAllUsers, LogInUser, RegisterUser, updateUserToAdmin } from './routers/usersRouters.js';
import { isAdmin,verifyUser, verifyAdmin  } from './auth/auth.js';
import upload from './middleware/upload.js';
import { CreatePosts,DeletePosts,UpdatePost, getAllPosts, getPostById } from './routers/PostsRouters.js';

import {
  createBooking,
  getUserBookings,
  updateBooking,
  deleteBooking,
  getAllBookings,
  getTicketTypes,
} from "./routers/TicketsRouters.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// app.use( cors() );
app.use( express.json() );
app.use( cookieParser() );

// Connect to MongoDB

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Allow CORS from development and production frontends. In dev we often run on :5173 so include it.
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (e.g. mobile apps, curl)
    if (!origin) return callback(null, true);
    const allowed = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://b4bf0086-6293-457c-a3a6-819f107e3454.lovableproject.com',
      'https://mern-product-production.up.railway.app',
      'http://localhost:8080'
    ];
    if (allowed.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // for now allow all to avoid blocking legitimate frontends —
      // in production you should restrict this list.
      callback(null, true);
    }
  },
  credentials: true,
}));


app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "API is running 🚀"
  });
});



// register & login routes
app.post( '/register', RegisterUser);

app.post( '/logIn', LogInUser );

// Get current profile (reads token from HttpOnly cookie)
app.get('/profile', verifyUser, (req, res) => {
  // verifyUser middleware attaches the user to req.user
  if (!req.user) return res.status(404).json({ message: 'User not found' });
  const { _id, userName, email, role, createdAt } = req.user;
  // return createdAt so frontend can show profile date
  return res.json({ _id, userName, email, role, createdAt });
});

// Update profile (current user)
import { updateProfile } from './routers/usersRouters.js';
app.put('/profile', verifyUser, updateProfile);

// get all users and filter it by role and if has teketc or not (Admin Only)
app.get('/admin/users',getAllUsers);

// delete & update Users
app.delete( '/admin/deleteUserAccount', deleteUserAccount );

app.put( "/admin/updateUserToAdmin", updateUserToAdmin );


// Create Post Route (Admin Only) 
app.post(
    "/admin/createPost",
    upload.array( "image", 3 ),
    CreatePosts
);

// delete Post Route (Admin Only)
app.delete( "/admin/deletePost/:id", DeletePosts );

// Update Post Route (Admin Only)
app.put(
  "/admin/updatePost/:id",
  upload.single("image"),
    UpdatePost
);

// Public posts routes
app.get('/posts', getAllPosts);
app.get('/posts/:id', getPostById);


// user booking routes
app.post("/bookings", verifyUser, createBooking);
app.get("/bookings", verifyUser, getUserBookings);
app.put("/bookings/:id", verifyUser, updateBooking);
app.delete("/bookings/:id", verifyUser, deleteBooking);

// Admin route to get all bookings
app.get("/admin/bookings", verifyAdmin, getAllBookings);

// Public ticket types
app.get('/tickets', getTicketTypes);



app.listen( PORT, () => {
    console.log("Server is running on port:", PORT);
})