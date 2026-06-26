/** Claims encoded into the JWT access token. */
export interface JwtPayload {
  /** Subject — the user id. */
  sub: string;
  /** User email (convenience claim). */
  email: string;
}

/** The authenticated user object attached to the request by the JWT strategy. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  fullname: string;
}
