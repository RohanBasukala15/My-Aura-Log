import { SerializedError, createSlice } from "@reduxjs/toolkit";

import { signIn } from "./signin.action";

interface SignInSliceState {
  isLoading: boolean;
  isSuccess?: boolean;
  error?: SerializedError;
}

const initialState: SignInSliceState = {
  isLoading: false,
  isSuccess: false,
  error: undefined,
};

const signInSlice = createSlice({
  name: "signIn",
  initialState,
  reducers: {
    clearSignInErrorState: (state) => {
      state.error = undefined;
    },
    resetState: (state) => {
      state = initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signIn.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(signIn.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.error = action.error;
      });
  },
});

export default signInSlice;
