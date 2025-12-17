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
import { CreatePosts,DeletePosts,UpdatePost } from './routers/PostsRouters.js';

import {
  createBooking,
  getUserBookings,
  updateBooking,
  deleteBooking,
  getAllBookings
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

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.error("Error connecting to MongoDB:", err));


app.use(cors({
  origin: "http://localhost:3000", // لو شغال محلي
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


// user booking routes
app.post("/bookings", verifyUser, createBooking);
app.get("/bookings", verifyUser, getUserBookings);
app.put("/bookings/:id", verifyUser, updateBooking);
app.delete("/bookings/:id", verifyUser, deleteBooking);

// Admin route to get all bookings
app.get("/admin/bookings", verifyAdmin, getAllBookings);



app.listen( PORT, () => {
    console.log("Server is running on port:", PORT);
})