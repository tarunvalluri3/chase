import { ZodError } from 'zod';

import { ValidationError } from '../errors/AppError.js';

function formatIssues(zodError) {
  return zodError.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

// Validates req.body/req.query/req.params against the given Zod schemas,
// replacing each with its parsed (coerced/trimmed) value on success.
export function validate({ body, query, params } = {}) {
  return (req, res, next) => {
    try {
      if (params) {
        req.params = params.parse(req.params);
      }
      if (query) {
        req.query = query.parse(req.query);
      }
      if (body) {
        req.body = body.parse(req.body);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new ValidationError('Invalid request', formatIssues(err)));
      } else {
        next(err);
      }
    }
  };
}
