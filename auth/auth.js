import UsersSchema from "../model/UsersSchema.js";
import { verifyToken } from "../auth/TokenCreater.js";

export const verifyUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = verifyToken(token);
    const user = await UsersSchema.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyAdmin = async (req, res, next) => {
  try {
    await verifyUser(req, res, async () => {
      if (!req.user.isAdmin) return res.status(403).json({ message: "Admins only" });
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