import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";

import { Box } from "../../../common/components/theme";

type PasswordValidatorState = { id: number; regexp: RegExp; validateColor: string };

type PasswordValidatorProps = {
  value: string;
  passwordValidateArr: PasswordValidatorState[];
};

function PasswordValidator({ value, passwordValidateArr }: PasswordValidatorProps) {
  const passwordValidate = passwordValidateArr.map((obj) => {
    if (obj.regexp.test(value)) {
      return <View key={obj.id} style={passwordValidateStyle(obj.id, obj.validateColor, passwordValidateArr)} />;
    }

    return null;
  });

  return (
    <Box width="100%" flexDirection="row" justifyContent="flex-start" alignItems="center">
      {passwordValidate}
    </Box>
  );
}

const passwordValidateStyle = (
  id: number,
  validateColor: string,
  passwordValidateArr: PasswordValidatorState[]
): StyleProp<ViewStyle> => ({
  width: "24%",
  borderWidth: 2,
  borderRadius: 2,
  borderColor: validateColor,
  backgroundColor: validateColor,
  marginRight: id < passwordValidateArr.length ? 6 : undefined,
});

export { PasswordValidator };
