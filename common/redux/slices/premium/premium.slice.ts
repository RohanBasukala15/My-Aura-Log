import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { Storage } from "../../../services/Storage";

const UPGRADE_ALERT_SHOWN_KEY = "myauralog_upgrade_alert_shown_date";

interface PremiumState {
    upgradeAlertShownToday: boolean;
    isLoading: boolean;
}

const getTodayDateString = (): string => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

const initialState: PremiumState = {
    upgradeAlertShownToday: false,
    isLoading: false,
};

// Async thunk to check if alert was shown today
export const checkUpgradeAlertStatus = createAsyncThunk(
    "premium/checkUpgradeAlertStatus",
    async () => {
        const lastShownDate = await Storage.getItem<string>(UPGRADE_ALERT_SHOWN_KEY, "");
        const today = getTodayDateString();
        return lastShownDate === today;
    }
);

const premiumSlice = createSlice({
    name: "premium",
    initialState,
    reducers: {
        setUpgradeAlertShown: (state, action: PayloadAction<boolean>) => {
            state.upgradeAlertShownToday = action.payload;
            if (action.payload) {
                // Store the date when alert was shown
                Storage.setItem(UPGRADE_ALERT_SHOWN_KEY, getTodayDateString()).then().catch();
            } else {
                // Clear the stored date if explicitly setting to false
                Storage.removeItem(UPGRADE_ALERT_SHOWN_KEY).then().catch();
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(checkUpgradeAlertStatus.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(checkUpgradeAlertStatus.fulfilled, (state, action) => {
                state.upgradeAlertShownToday = action.payload;
                state.isLoading = false;
            })
            .addCase(checkUpgradeAlertStatus.rejected, (state) => {
                state.upgradeAlertShownToday = false;
                state.isLoading = false;
            });
    },
});

export const { setUpgradeAlertShown } = premiumSlice.actions;
export default premiumSlice;

