import { AppError } from '../errors/AppError.js';

// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    const body = { error: { message: err.message } };
    if (err.details) {
      body.error.details = err.details;
    }
    return res.status(err.status).json(body);
  }

  // express.json() throws a SyntaxError (type 'entity.parse.failed') for a
  // malformed request body -- a client error, not a server failure.
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400)) {
    return res.status(400).json({ error: { message: 'Malformed JSON in request body' } });
  }

  console.error(err);
  res.status(500).json({
    error: {
      message: 'Internal server error',
    },
  });
}
