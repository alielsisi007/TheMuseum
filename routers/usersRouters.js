import UsersSchema from '../model/UsersSchema.js';
import bcrypt from 'bcrypt';
import { createToken,verifyToken } from '../auth/TokenCreater.js';
import { isAdmin } from '../auth/auth.js';

// Register User
export const RegisterUser = async ( req, res ) => {
    try {
        const { username, email, password } = req.body;
          if (!username || !email || !password) {
                return res.status(400).json({ error: "All fields are required" });
          }

        // hash the password 
        const hashedPass = bcrypt.hashSync( password, 10 )
        const user =  await UsersSchema.create( {
            userName: username,
            email: email,
            passwordHash: hashedPass,
        } )
        const token = createToken( user )
            res.cookie("token", token, {
            httpOnly: true,
            secure: false, // true لو HTTPS
            sameSite: "lax", // أو 'none' لو cross-site
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(201).json({ message: "User registered successfully", token });
    } catch (err) {
        console.error("Register Error:", err); // للتصحيح في السيرفر
        res.status(500).json({ error: "Error Registering User: " + err.message });
    }
}

// Login User

export const LogInUser =  async ( req, res ) => {
    try {
        const { email, password } = req.body;
        if ( !email || !password ) {
                return res.status(400).json({ error: "All fields are required" });
        }
        const user = await UsersSchema.findOne( { email } );
       
        
         if ( !user ) {
                 return res.status(404).json({ error: "User not found" });
         }
        const isPasswordValid = bcrypt.compareSync( password, user.passwordHash );
        if (!password || !isPasswordValid ) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        const token = createToken( user );
        res.cookie("token", token, {
        httpOnly: true,
        secure: false, // true لو HTTPS
        sameSite: "lax", // أو 'none' لو cross-site
        maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(200).json({message: "User logged in successfully", token})

    } catch ( err ) {
        res.status( 500 ).json( { error: "Error Logging In User: " + err.message } );
    }
}

// Delete User Account
export const deleteUserAccount = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const decoded = verifyToken( token );
        
        const user = await UsersSchema.findById(decoded.id);
        console.log(user);

        if (!user) {
            return res.status(404).json({ message: "User not found", userId: decoded.id });
        }

        const admin = await isAdmin(user);

        if (!admin) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const { userId } = req.body;

        await UsersSchema.deleteOne({ _id: userId });

        return res.status(200).json({ message: "User deleted successfully" });

    } catch (err) {
        console.error("Delete User Error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

// Update User to Admin
export const updateUserToAdmin = async ( req, res ) => {
    try {
        const { userId } = req.body;
        const user = await UsersSchema.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        user.role = "admin";
        await user.save();
        res.status(200).json({ message: "User updated to admin successfully" });
    } catch ( err ) {
        res.status( 500 ).json( { error: "Error updating user to admin: ", err } );
    }
}

// Get all users only Admin 

export const getAllUsers =  async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ message: "No token" });

        const decoded = verifyToken(token);
        const user = await UsersSchema.findById(decoded.id);

        if (!user || !isAdmin(user)) {
            return res.status(403).json({ message: "Admins only" });
        }

        const users = await UsersSchema.find();
        return res.json(users);
    } catch (err) {
        console.error("Get Users Error:", err);
        return res.status(500).json({ message: "Server error" });
    }
} 