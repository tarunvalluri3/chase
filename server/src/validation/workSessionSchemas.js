import { idParamSchema } from './taskSchemas.js';

// Sessions are nested under a task id (/api/tasks/:id/sessions/*). No
// request-body schemas are needed on any of the six endpoints -- every
// session timestamp/state field is server-controlled, matching CLAUDE.md's
// rule that lifecycle transitions never accept client-supplied fields.
export const taskIdParamSchema = idParamSchema;
