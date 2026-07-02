import jwt from 'jsonwebtoken';

// Base authentication verification (Validates JWT)
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Access Denied: No Token Provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Safe fallback in case process.env.JWT_SECRET path mapping issues exist during local boots
        const secretKey = process.env.JWT_SECRET || 'your_fallback_secret';
        const verified = jwt.verify(token, secretKey);

        req.user = verified; // Inject payload variables: { id, email, role }
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Invalid or Expired Token' });
    }
};

// Role-based authorization guard factory
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Forbidden: Insufficient Permissions' });
        }
        next();
    };
};