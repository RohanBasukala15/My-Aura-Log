export type SignInPayload = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type SignInResponse = {
  token_type: string;
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
};
