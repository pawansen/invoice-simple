export interface UserProfile {
  id: string;
  email: string;
  fullname: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserProfile;
}
