import React, { useState, useEffect, useRef } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useFormik } from "formik";
import { useRouter } from "expo-router";

import { Toast } from "@common/utils";
import { useLoginSchema } from "@common/validations";
import { PasswordAccessory } from "@app/auth/setPassword";
import { AppFonts } from "@common/components/configuration";
import { useFeatureTranslation } from "@common/services/i18n";
import { useFormikErrors } from "@common/hooks";
import { Text, Box, Button, PageView, TextInput, Checkbox, useTheme } from "@common/components";
import { useAppDispatch, signInActions, useAppSelector } from "@common/redux";

const SignIn = () => {
  const { isLoading: signInIsLoading, error: signInError } = useAppSelector((state) => state.signIn);
  const { rememberUser } = useAppSelector((state) => state.appConfiguration);

  const [passwordVisible, setPasswordVisible] = useState(true);

  const styles = useStyles();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const passwordRef = useRef<TextInput>(null);
  const t = useFeatureTranslation("screens.login.");

  const fieldLabels = React.useMemo(
    () => ({
      email: t("labels.email"),
      password: t("labels.password"),
    }),
    [t]
  );
  const validationSchema = useLoginSchema(fieldLabels);

  const formik = useFormik({
    validationSchema,
    initialValues: {
      password: "",
      email: rememberUser?.email ?? "",
      rememberMe: rememberUser?.rememberMe,
    },
    onSubmit: (values) => {
      Toast.show("Sign in successful", { type: "success" });
      router.replace("/(public)/sample");
    },
  });
  const { errors } = useFormikErrors(formik);

  useEffect(() => {
    if (signInError?.message) {
      Toast.show((signInError as Error)?.message, { type: "error" });
      dispatch(signInActions.clearSignInErrorState());
    }
  }, [signInError]);

  const passwordVisibleHandler = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <PageView statusBarStyle="dark">
      <>
        <Box marginTop="xl">{/*<AppLogo />*/}</Box>

        <Box paddingVertical={"xs"}>
          <Text style={styles.signInText}>{t("actions.sign_in")}</Text>
        </Box>

        <Box>
          <Box flex={1} alignItems="center" flexDirection="row">
            <Text style={styles.descText}>{t("titles.welcome_text")}</Text>
          </Box>
        </Box>

        <Box paddingBottom={"sm"} paddingTop={"xl"}>
          <TextInput
            returnKeyType="next"
            error={errors.email}
            autoCapitalize="none"
            label={fieldLabels.email}
            value={formik.values.email}
            editable={!signInIsLoading}
            keyboardType="email-address"
            placeholder={t("placeholder.email") ?? ""}
            onSubmitEditing={passwordRef?.current?.focus}
            onBlur={formik.handleBlur("email")}
            onChangeText={formik.handleChange("email")}
          />

          <Box paddingVertical={"xs"} />

          <TextInput
            editable={!signInIsLoading}
            autoCapitalize="none"
            secureTextEntry={passwordVisible}
            label={fieldLabels.password}
            placeholder={t("labels.enter_password") || ""}
            returnKeyType="go"
            ref={passwordRef}
            onChangeText={formik.handleChange("password")}
            value={formik.values.password}
            onBlur={formik.handleBlur("password")}
            suffix={() => <PasswordAccessory open={passwordVisible} onPress={passwordVisibleHandler} />}
            error={errors.password}
            onSubmitEditing={() => formik.handleSubmit()}
          />

          <Box paddingVertical={"xxs"} />

          <Box flexDirection="row" justifyContent="space-between" alignItems="center">
            <Checkbox
              disabled={signInIsLoading}
              title={t("labels.keep_signed_in") || ""}
              selected={formik.values.rememberMe}
              titleContainerStyle={{}}
              onPress={() => {
                formik.setFieldValue("rememberMe", !formik.values.rememberMe);
              }}
            />

            {/*<Pressable*/}
            {/*  disabled={signInIsLoading}*/}
            {/*  style={styles.allCenter}*/}
            {/*  onPress={() => router.push("/(auth)/forgot-password")}*/}
            {/*>*/}
            {/*  <Text variant={"h6"} fontWeight={"400"} color="black">*/}
            {/*    {t("actions.forgot_password")}*/}
            {/*  </Text>*/}
            {/*</Pressable>*/}
          </Box>

          <Box paddingVertical={"l"} />

          <Button
            label={t("actions.sign_in")}
            variant="primary"
            size="large"
            labelVariant="button"
            loading={signInIsLoading}
            disabled={signInIsLoading}
            onPress={formik.handleSubmit}
          />
        </Box>

        <Box style={styles.bottomContainer}>
          <Box style={styles.bottomView}>
            <Text variant={"h5"}>{t("labels.dont_have_an_account")}</Text>

            <Pressable disabled={signInIsLoading} onPress={() => router.push("/(auth)/sign-up")}>
              <Text color="primary" style={styles.touchableNormalText16}>
                {t("actions.sign_up")}
              </Text>
            </Pressable>
          </Box>
        </Box>
      </>
    </PageView>
  );
};

const useStyles = () => {
  const theme = useTheme();

  return StyleSheet.create({
    signInText: {
      fontSize: theme.spacing.xxxm,
      lineHeight: 37,
      fontFamily: AppFonts.Medium_500,
    },
    descText: {
      fontSize: theme.spacing.xm,
      fontWeight: "500",
      lineHeight: 40,
      fontFamily: AppFonts.Regular_400,
    },
    touchableNormalText16: {
      fontSize: 16,
      fontFamily: AppFonts.SemiBold_600,
    },
    bottomContainer: {
      justifyContent: "flex-end",
      paddingVertical: theme.spacing.xm,
    },
    bottomView: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      alignSelf: "center",
    },
    allCenter: {
      justifyContent: "center",
      alignItems: "center",
    },
  });
};

export default SignIn;
