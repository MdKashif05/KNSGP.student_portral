import rateLimit from 'express-rate-limit';

export const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: { message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// General API rate limiter
export const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later.'
);

// Strict rate limiter for authentication endpoints
export const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes  
  5, // limit each IP to 5 requests per windowMs
  'Too many authentication attempts, please try again later.'
);

// Rate limiter for chatbot endpoints
export const chatbotLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  10, // limit each IP to 10 requests per minute
  'Too many chat requests, please try again later.'
);