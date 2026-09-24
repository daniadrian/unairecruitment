// Kinds of controller action failures. Used by routing adapters to pick the right HTTP status
// without interpreting the message text (user-facing messages still belong to the controller, V-9).
export type ActionErrorCode =
    | 'VALIDATION'
    | 'UNAUTHENTICATED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'RATE_LIMITED'
    | 'PAYLOAD_TOO_LARGE'
    | 'INTERNAL'
