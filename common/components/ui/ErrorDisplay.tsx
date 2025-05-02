import React from "react";
import { Pressable } from "react-native";

import { Box, Text } from "../theme";
import { AppFonts } from "../configuration";

import { useFeatureTranslation } from "@common/services/i18n";

interface ErrorDisplayProps {
  message: string;
  onFetchAgainHandler: () => void;
}

const ErrorDisplay = ({ message, onFetchAgainHandler }: ErrorDisplayProps) => {
  const t = useFeatureTranslation("components.errorDisplay.");

  return (
    <Box flex={1} alignItems="center" justifyContent="center">
      <Text variant={"h5"} fontWeight={"600"}  color={"black"}>
        {message}
      </Text>

      <Box marginBottom={"xxl"} />

      <Pressable onPress={onFetchAgainHandler}>
        <Text variant={"h5"} fontWeight={"700"} color={"primary"}>
          {t("labels.refresh")}
        </Text>
      </Pressable>
    </Box>
  );
};

export { ErrorDisplay };
