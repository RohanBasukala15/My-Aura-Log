export type AddRelativePayload = {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  address: string;
  bloodGroup: string;
};

export interface AddRelativeResponse {
  phone_number: string;
  token: string;
}
