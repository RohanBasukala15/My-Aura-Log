import React from "react";
import { StyleSheet } from "react-native";

import { Button } from "../button";
import { FooterView } from "../FooterView";
import { Text, Box, useTheme } from "../../theme";

interface NoticeScreenProps {
  bottomTitle: string;
  description?: string;
  descriptionBox?: React.ReactNode;
  logo: React.ReactNode;
  onPressButton: () => void;
  title: string;
}

const NoticeScreen = ({ title, description, descriptionBox, bottomTitle, logo, onPressButton }: NoticeScreenProps) => {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <>
      <Box justifyContent={"flex-end"} flex={1}>
        <Box style={styles.logoContainer}>{logo}</Box>

        <Box paddingVertical={"m"}>
          <Text
            fontFamily="HankenGrotesk_600SemiBold"
            lineHeight={theme.spacing.xl}
            variant={"h3"}
            fontWeight="600"
            color="black"
            textAlign="center"
          >
            {title}
          </Text>

          {!descriptionBox && (
            <Text variant={"h6"} color="black" fontWeight="400" textAlign={"center"} paddingVertical="m">
              {description}
            </Text>
          )}

          {descriptionBox && descriptionBox}
        </Box>
      </Box>

      <Box justifyContent={"flex-end"} style={styles.detailsContainer}>
        <FooterView>
          <Button onPress={onPressButton} variant="primary" label={bottomTitle} />
        </FooterView>
      </Box>
    </>
  );
};

const useStyles = () => {
  const theme = useTheme();

  return StyleSheet.create({
    logoContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: theme.spacing.xxl,
    },
    detailsContainer: {
      alignItems: "center",
    },
  });
};

export { NoticeScreen };
