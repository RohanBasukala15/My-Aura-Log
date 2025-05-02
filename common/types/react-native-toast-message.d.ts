import type { ToastData, ToastConfigParams, ToastOptions } from "react-native-toast-message";
export type AppToastTypes = "success" | "warning" | "error" | "information";

type AppToastShowParams = ToastData & Omit<ToastOptions, "type"> & { type?: AppToastTypes };

type AppToastConfig = Record<AppToastTypes, (params: ToastConfigParams<unknown>) => React.ReactNode>;

declare module "react-native-toast-message" {
  type ToastType = AppToastTypes;
  type ToastShowParams = AppToastShowParams;
  type ToastConfig = AppToastConfig;
}
