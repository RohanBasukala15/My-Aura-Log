import React from "react";
import { ViewStyle, StyleProp, TextStyle } from "react-native";

import { Box, Text } from "../theme";
import { shortenName } from "../../utils";

interface ImageTitleProps {
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  name: string;
}

export const ImageTitle = ({ name, textStyle, containerStyle }: ImageTitleProps) => {
  const label = shortenName(name);
  return (
    <>
      <Box style={containerStyle} justifyContent="center" alignItems="center" backgroundColor="white">
        <Text
          style={textStyle}
          variant={"h4"}
          fontWeight={"700"}
          color={"primary"}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
        >
          {label}
        </Text>
      </Box>
    </>
  );
};
