import { SerializedError, createSlice } from "@reduxjs/toolkit";

import { initializeSignup, addRelative, signUpSetPassword } from "./signup.action";

interface SignupSliceState {
  formState: {
    email?: string;
    mobileNumber?: string;
    otpToken?: string;
  };
  registration: {
    isLoading: boolean;
    isSuccess?: boolean;
    error?: SerializedError;
  };
  addRelatives: {
    isLoading: boolean;
    isSuccess?: boolean;
    error?: SerializedError;
  };
  setPassword: {
    isLoading: boolean;
    isSuccess?: boolean;
    error?: SerializedError;
  };
}

const initialState: SignupSliceState = {
  formState: {},
  registration: {
    isLoading: false,
    isSuccess: false,
    error: undefined,
  },
  addRelatives: {
    isLoading: false,
    isSuccess: false,
    error: undefined,
  },
  setPassword: {
    isLoading: false,
    isSuccess: false,
    error: undefined,
  },
};

const signupSlice = createSlice({
  name: "signup",
  initialState,
  reducers: {
    clearSignupInitState: (state) => {
      state.registration.isSuccess = false;
      state.registration.error = undefined;
    },
    clearOtpVerificationState: (state) => {
      state.addRelatives.isSuccess = false;
      state.addRelatives.error = undefined;
    },
    clearSetPasswordState: (state) => {
      state.setPassword.isSuccess = false;
      state.setPassword.error = undefined;
    },
    resetState: (state) => {
      return (state = { ...initialState });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeSignup.pending, (state, action) => {
        state.registration.isLoading = true;
        state.formState.email = action.meta.arg.email;
        state.formState.mobileNumber = action.meta.arg.mobileNumber;
      })
      .addCase(initializeSignup.fulfilled, (state, action) => {
        state.registration.isLoading = false;
        state.registration.isSuccess = true;
        state.formState.mobileNumber = action.meta.arg.mobileNumber;
      })
      .addCase(initializeSignup.rejected, (state, action) => {
        state.registration.isLoading = false;
        state.registration.error = action.error;
      })
      .addCase(addRelative.pending, (state, action) => {
        state.addRelatives.isLoading = true;
      })
      .addCase(addRelative.fulfilled, (state, action) => {
        state.addRelatives.isLoading = false;
        state.addRelatives.isSuccess = true;
        state.formState.otpToken = action.payload.token;
        state.formState.mobileNumber = action.payload.phone_number;
      })
      .addCase(addRelative.rejected, (state, action) => {
        state.addRelatives.isLoading = false;
        state.addRelatives.error = action.error;
      })
      .addCase(signUpSetPassword.pending, (state) => {
        state.setPassword.isLoading = true;
      })
      .addCase(signUpSetPassword.fulfilled, (state, action) => {
        state.setPassword.isLoading = false;
        state.setPassword.isSuccess = true;
      })
      .addCase(signUpSetPassword.rejected, (state, action) => {
        state.setPassword.isLoading = false;
        state.setPassword.error = action.error;
      });
  },
});

export default signupSlice;
