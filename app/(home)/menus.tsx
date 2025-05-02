import React from "react";
import { View, Pressable, StyleProp, TextStyle, StyleSheet, TouchableWithoutFeedback } from "react-native";
import colorAlpha from "color-alpha";
import { SvgProps } from "react-native-svg";
import { useRouter, Href } from "expo-router";
import * as ExpoWebBrowser from "expo-web-browser";

import { useFeatureTranslation } from "@common/services/i18n";
import { useAppDispatch, userActions, useAppSelector } from "@common/redux";
import { ArrowRight, Edit, Logout, PasswordCursor, PrivacyPolicy, Quiz, TermsConditions } from "@common/assets";
import { Box, HeaderView, HeaderTitleDesc, PageView, Text, useTheme, Loader, ImageTitle } from "@common/components";

const useMenus = (): {
  href?: Href<string>;
  icon: React.ComponentType;
  iconProps?: SvgProps;
  suffix?: React.ComponentType;
  tag: string;
  title: string;
  titleStyle?: StyleProp<TextStyle>;
  url?: string;
}[] => {
  const theme = useTheme();
  const t = useFeatureTranslation("screens.menus.");

  return [
    {
      tag: "change_password",
      title: t("labels.menus.change_password"),
      icon: PasswordCursor,
      href: "/change-password/",
      iconProps: { stroke: theme.colors.iconsDefault },
    },
    {
      tag: "terms_and_condition",
      title: t("labels.menus.terms_and_condition"),
      icon: TermsConditions,
      url: "https://www.google.com",
      iconProps: { stroke: theme.colors.iconsDefault },
    },
    {
      tag: "privacy_policy",
      title: t("labels.menus.privacy_policy"),
      icon: PrivacyPolicy,
      url: "https://www.google.com",
      iconProps: { stroke: theme.colors.iconsDefault },
    },
    {
      tag: "logout",
      title: t("labels.menus.logout"),
      suffix: View,
      icon: Logout,
      iconProps: { fill: theme.colors.iconsCritical },
      titleStyle: { color: theme.colors.textCritical },
    },
  ];
};

function Menus() {
  const { userDetails, signout } = useAppSelector((state) => state.user);

  const menus = useMenus();
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const t = useFeatureTranslation("screens.menus.");

  return (
    <PageView type="ScrollView" statusBarStyle="dark">
      <Box flex={1}>
        <HeaderView />
        <HeaderTitleDesc title={t("titles.navigation")} description={t("messages.navigation")} />

        <Box marginVertical="l">
          <Text>{t("labels.account")}</Text>

          <Box flexDirection="row" justifyContent="space-between">
            <Box marginTop="m" flexDirection="row" gap="m">
              <ImageTitle
                containerStyle={styles.profileImage}
                name={`${userDetails?.firstName} ${userDetails?.lastName}`}
              />

              <Box>
                <Text variant="h6" fontWeight="700">
                  {`${userDetails?.firstName ?? ""} ${userDetails?.lastName ?? ""}`}
                </Text>

                <Text variant="h7" fontWeight="400" marginTop="s">
                  {`+${userDetails?.msisdn ?? ""}`}
                </Text>
              </Box>
            </Box>

            <Box justifyContent="center">
              <TouchableWithoutFeedback onPress={() => router.push("/profile/edit")}>
                <Box
                  width={30}
                  height={30}
                  borderRadius="s"
                  alignItems="center"
                  justifyContent="center"
                  style={{ backgroundColor: colorAlpha(theme.colors.primary, 0.3) }}
                >
                  <Edit stroke={theme.colors.iconsDefault} />
                </Box>
              </TouchableWithoutFeedback>
            </Box>
          </Box>

          <Box>
            <Box paddingVertical="l">
              {menus.map(({ tag, title, icon: Icon, suffix, iconProps, titleStyle, href, url }, index) => {
                const SuffixRender = suffix;

                return (
                  <Pressable
                    key={tag}
                    android_ripple={{ color: theme.colors.surfaceDefault }}
                    hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    onPress={() => {
                      if (href) {
                        router.push(href);
                      } else if (url) {
                        ExpoWebBrowser.openBrowserAsync(url).then().catch();
                      } else if (tag === "logout") {
                        dispatch(userActions.signout());
                      }
                    }}
                  >
                    <Box flex={1} gap="s" paddingVertical="m" flexDirection="row" justifyContent="space-between">
                      <Box justifyContent="center">
                        <Icon width={16} height={16} {...iconProps} />
                      </Box>

                      <Box flex={1} justifyContent="center">
                        <Text variant="h5" style={titleStyle}>
                          {title}
                        </Text>
                      </Box>

                      <Box justifyContent="center">
                        {SuffixRender ? <SuffixRender /> : null}
                        {!SuffixRender ? <ArrowRight width={12} height={12} fill={theme.colors.iconsDefault} /> : null}
                      </Box>
                    </Box>
                  </Pressable>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>

      <Loader visible={signout?.isLoading} />
    </PageView>
  );
}

const styles = StyleSheet.create({
  profileImage: { width: 42, height: 42, borderRadius: 6 },
});

export default Menus;
