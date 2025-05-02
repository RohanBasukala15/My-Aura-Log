import { Platform } from "react-native";
import * as Crypto from "expo-crypto";
import * as Application from "expo-application";

import { SecureStorage } from "../services/Storage";

export async function getDeviceId(): Promise<string> {
  let deviceId;

  if (Platform.OS === "android") {
    deviceId = Application.androidId;
  }

  if (!deviceId) {
    deviceId = await SecureStorage.getItem<string>("secure_device_id");
  }

  if (!deviceId) {
    deviceId = Crypto.randomUUID();
    await SecureStorage.setItem("secure_device_id", deviceId);
  }

  return deviceId;
}
