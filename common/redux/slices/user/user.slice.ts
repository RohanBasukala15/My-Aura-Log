import { SerializedError, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { UserInfo } from "../../models/Base";

import { changePassword, editProfile, signout } from "./user.action";

interface UserSliceState {
  editProfile: {
    isLoading: boolean;
    isSuccess: boolean;
    error?: SerializedError;
  };
  signout: {
    isLoading: boolean;
    completed: boolean;
    error?: SerializedError;
  };
  changePassword: {
    isLoading: boolean;
    isSuccess: boolean;
    error?: SerializedError;
  };
  userDetails?: UserInfo | null;
}

const initialState: UserSliceState = {
  signout: {
    isLoading: false,
    completed: false,
  },
  changePassword: {
    isLoading: false,
    isSuccess: false,
  },
  editProfile: {
    isLoading: false,
    isSuccess: false,
  },
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    resetSignoutState: (state) => {
      state.signout = initialState.signout;
    },
    clearChangePasswordState: (state) => {
      state.changePassword = initialState.changePassword;
    },
    setUserDetails: (state, action: PayloadAction<UserInfo | undefined | null>) => {
      state.userDetails = action.payload;
    },
    clearEditProfileSliceState: (state) => {
      state.editProfile = initialState.editProfile;
    },
    resetState: (state) => {
      state = { ...initialState };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signout.pending, (state) => {
        state.signout.isLoading = true;
      })
      .addCase(signout.fulfilled, (state) => {
        state.signout.isLoading = false;
        state.signout.completed = true;
      })
      .addCase(signout.rejected, (state, action) => {
        state.signout.isLoading = false;
        state.signout.error = action.error;
      })

      .addCase(changePassword.pending, (state) => {
        state.changePassword.isLoading = true;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.changePassword.isLoading = false;
        state.changePassword.isSuccess = true;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.changePassword.isLoading = false;
        state.changePassword.error = action.error;
      })

      .addCase(editProfile.pending, (state) => {
        state.editProfile.isLoading = true;
      })
      .addCase(editProfile.fulfilled, (state, action) => {
        state.editProfile.isLoading = false;
        state.editProfile.isSuccess = true;
        state.userDetails = action.payload;
      })
      .addCase(editProfile.rejected, (state, action) => {
        state.editProfile.isLoading = false;
        state.editProfile.error = action.error;
      });
  },
});

export default userSlice;
