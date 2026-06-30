import { Response } from 'express';

export const handleError = (res: Response, error: any) => {
  console.error('API Error detailed:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
  
  if (error.code) {
    // This is likely a PostgreSQL driver error
    switch (error.code) {
      case '23505': // unique_violation
        return res.status(409).json({ error: 'A record with this information already exists.' });
      case '23503': // foreign_key_violation
        return res.status(400).json({ error: 'Referenced record does not exist or cannot be modified.' });
      default:
        // Temporarily send back the actual database error code and message for debugging
        return res.status(500).json({ error: 'A database error occurred.', code: String(error.code), message: String(error.message) });
    }
  }

  // If it's a known error message thrown by our services (e.g. throw new Error('Unauthorized'))
  const message = error.message || 'An unexpected error occurred.';
  const status = message.includes('Unauthorized') ? 403 : message.includes('not found') ? 404 : 400;
  
  return res.status(status).json({ error: message });
};
