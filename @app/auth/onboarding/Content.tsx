import React from "react";
import { View, StyleSheet } from "react-native";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

import { Box, Text } from "@common/components";

type ContentProps = {
  icon: React.ComponentType;
  text: string;
  title: string;
};

function Content({ icon, text, title }: ContentProps) {
  const Icon = icon;

  return (
    <>
      <Box marginBottom={"xxxl"} />
      <Box marginBottom={"xxxl"} />

      <Box paddingHorizontal="xxm">
        <Box width="100%" height={hp(26.0)} alignSelf={"center"}>
          <Icon />
        </Box>

        <Box marginBottom="xxxl" />

        <Text variant="h4" fontWeight="600" fontFamily="HankenGrotesk_600SemiBold" color="black">
          {title}
        </Text>

        <Box marginBottom="sm" />

        <View style={styles.textWrapperStyle}>
          <Text variant="h5" fontWeight={"500"} color="grey">
            {text}
          </Text>
        </View>
      </Box>
    </>
  );
}

const styles = StyleSheet.create({
  textWrapperStyle: {
    minHeight: 72,
  },
});

export { Content };
