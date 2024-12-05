import { Request, Response, NextFunction } from 'express';

// Extend the Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const adminToken = req.headers['x-admin-token'];
  
  console.log('Headers received:', req.headers);
  console.log('Admin token received:', adminToken);
  console.log('Expected admin token:', process.env.ADMIN_SECRET);
  console.log('Token match:', adminToken === process.env.ADMIN_SECRET);
  
  if (adminToken !== process.env.ADMIN_SECRET) {
    console.log('Admin authentication failed');
    return res.status(401).json({ 
      message: 'Unauthorized - Invalid admin token',
      received: adminToken,
      expected: process.env.ADMIN_SECRET
    });
  }

  // Add a mock user ID for admin actions
  req.user = {
    _id: 'admin',
    role: 'admin'
  };

  console.log('Admin authentication successful');
  next();
}; 