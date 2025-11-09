declare module "@react-native-community/datetimepicker" {
  import * as React from "react";

  export type DateTimePickerEvent = {
    type: "set" | "dismissed";
    nativeEvent: {
      timestamp: number;
    };
  };

  export type DateTimePickerAndroidOpenParams = {
    value: Date;
    onChange: (event: DateTimePickerEvent, date?: Date) => void;
    mode?: "date" | "time" | "datetime";
    is24Hour?: boolean;
    display?: string;
    neutralButtonLabel?: string;
    positiveButtonLabel?: string;
    negativeButtonLabel?: string;
  };

  export const DateTimePickerAndroid: {
    open: (params: DateTimePickerAndroidOpenParams) => void;
    dismiss: (mode?: "date" | "time" | "datetime") => void;
  };

  type DateTimePickerProps = {
    value: Date;
    mode?: "date" | "time" | "datetime";
    display?: "default" | "spinner" | "calendar" | "clock";
    onChange: (event: DateTimePickerEvent, date?: Date) => void;
    minimumDate?: Date;
    maximumDate?: Date;
    minuteInterval?: number;
    locale?: string;
    disabled?: boolean;
  };

  const DateTimePicker: React.ComponentType<DateTimePickerProps>;
  export default DateTimePicker;
}

