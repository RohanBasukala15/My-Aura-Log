export interface ApiResponse<I = undefined> {
  status: string;
  message: string;
  data: I;
}

export interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  msisdn: string;
  user_id: string;
  profileImage?: string;
}

export interface Paginated<I> {
  data: I;
  total: number;
}

export interface PaginatedParams {
  page: number;
  pageSize: number;
}

export type SupportedLanguage = "en";

export interface AppSession {
  token_type: string;
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
}

export interface RememberUserState {
  email: string;
  rememberMe: boolean;
}

export interface RegisterDeviceResponse {
  userId: string;
  deviceId: string;
  fcmId: string;
}
