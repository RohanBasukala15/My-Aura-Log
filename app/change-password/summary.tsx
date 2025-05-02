import React from "react";
import { Stack, useRouter } from "expo-router";

import { Success } from "@common/assets";
import { Box, Button, PageView, Text } from "@common/components";
import { useFeatureTranslation } from "@common/services/i18n";

function ChangePasswordCompleteScreen() {
  const router = useRouter();
  const t = useFeatureTranslation("screens.change_password.");

  return (
    <PageView type="ScrollView" statusBarStyle="dark">
      <>
        <Stack.Screen options={{ gestureEnabled: false }} />

        <Box flex={1} justifyContent="center">
          <Box alignSelf={"center"}>
            <Success />
          </Box>

          <Box marginVertical="m" />

          <Box alignItems="center" gap="m">
            <Text variant="h2" textAlign="center">
              {t("messages.password_change_title")}
            </Text>
            <Text variant="h5" textAlign="center">
              {t("messages.password_change_description")}
            </Text>
          </Box>

          <Box marginVertical="xl" />

          <Button
            variant="primary"
            label={t("actions.back_to_dashboard")}
            // need to change on replace later:
            onPress={() => {
              router.push("/(home)/dashboard");
            }}
          />
        </Box>
      </>
    </PageView>
  );
}

export default ChangePasswordCompleteScreen;
