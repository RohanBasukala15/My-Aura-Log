import React from "react";
import { TouchableOpacity } from "react-native";

import { EyeClose, EyeOpen } from "../../../common/assets/icons/svgs";

type PasswordAccessoryProps = {
  open: boolean;
  onPress: () => void;
};

function PasswordAccessory({ open, onPress }: PasswordAccessoryProps) {
  return (
    <TouchableOpacity onPress={onPress} style={{ paddingRight: 10 }}>
      {open ? <EyeClose width={24} height={24} /> : <EyeOpen width={24} height={24} />}
    </TouchableOpacity>
  );
}

export { PasswordAccessory };
