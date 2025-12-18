import UsersSchema from "../model/UsersSchema.js";
import { verifyToken } from "../auth/TokenCreater.js";

export const verifyUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      console.warn('verifyUser: no token cookie present. Cookies:', req.cookies);
      return res.status(401).json({ message: "No token" });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (e) {
      console.warn('verifyUser: token verify failed', e && e.message);
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = await UsersSchema.findById(decoded.id);
    if (!user) {
      console.warn('verifyUser: user not found for id', decoded.id);
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    // don't log full user for privacy, just id and role
    console.log('verifyUser: authenticated user', { id: user._id.toString(), role: user.role });
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyAdmin = async (req, res, next) => {
  try {
    // ensure the requester is an authenticated user first
    await verifyUser(req, res, async () => {
      // UsersSchema stores role in `user.role` (value 'admin' for admins).
      // Older code checked `req.user.isAdmin` which doesn't exist and caused false negatives.
      if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
      next();
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


export const isAdmin = async ( user ) => {
    if ( user.role === 'admin' ) {
        return true;
    } else {
        return false;
    }
}