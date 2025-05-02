import { UserInfo } from "./Base";

export interface SignupPayload {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  address: string;
  bloodGroup: string;
}

export interface SignupSetPasswordPayload {
  email: string;
  token: string;
  password: string;
}

export interface SignupResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
}
