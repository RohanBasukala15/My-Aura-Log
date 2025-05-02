import React, { useState, useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { useFormik } from "formik";
import { useRouter } from "expo-router";

import { Toast } from "@common/utils";
import AppConstants from "@common/assets/AppConstants";
import { useFeatureTranslation } from "@common/services/i18n";
import { RegexExpression, changePasswordSchema } from "@common/validations";
import { PasswordAccessory, PasswordValidator } from "@app/auth/setPassword";
import {
  Box,
  Text,
  Button,
  Loader,
  TextInput,
  PageView,
  HeaderView,
  HeaderTitleDesc,
  FooterView,
} from "@common/components";
import { userActions, useAppDispatch, useAppSelector } from "@common/redux";

type PasswordValidateState = { id: number; regexp: RegExp; validateColor: string };

const passwordValidateArr: PasswordValidateState[] = [
  { id: 0, regexp: RegexExpression.Alphabhets, validateColor: "#EC775F" },
  { id: 1, regexp: RegexExpression.SpecialChars, validateColor: "#FAE1AD" },
  { id: 2, regexp: RegexExpression.CharactersAndIntegers, validateColor: "#B8E7A2" },
  { id: 3, regexp: RegexExpression.Password, validateColor: "#1067B2" },
];

function SetPassword() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const t = useFeatureTranslation("screens.change_password.");

  const { isLoading, isSuccess, error } = useAppSelector((state) => state.user.changePassword);

  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(true);
  const [newPasswordVisible, setNewPasswordVisible] = useState(true);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(true);

  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const fieldLabels = React.useMemo(
    () => ({
      currentPassword: t("labels.current_password"),
      newPassword: t("labels.new_password"),
      confirmPassword: t("labels.confirm_password"),
    }),
    [t]
  );

  const { handleChange, handleSubmit, handleBlur, values, errors, touched } = useFormik({
    validationSchema: changePasswordSchema(fieldLabels),
    initialValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    onSubmit: (values) => {
      dispatch(
        userActions.changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
          confirmNewPassword: values.confirmPassword,
        })
      );
    },
  });

  useEffect(() => {
    if (isSuccess) {
      dispatch(userActions.clearChangePasswordState());
      router.replace("/change-password/summary");
    }

    if (error) {
      Toast.show(error.message!, { type: "error" });
      dispatch(userActions.clearChangePasswordState());
    }
  }, [isSuccess, error]);

  return (
    <PageView statusBarStyle="dark" type="KeyboardAwareScrollView" style={styles.setPasswordWrapperStyle}>
      <Box flex={1}>
        <HeaderView />
        <HeaderTitleDesc title={t("titles.setPassword")} description={t("titles.safe_strong")} />

        <Box flex={1} justifyContent={"space-between"} paddingTop="l">
          <Box>
            <TextInput
              editable={!isLoading}
              secureTextEntry={currentPasswordVisible}
              label={fieldLabels.currentPassword}
              placeholder={fieldLabels.currentPassword}
              returnKeyType="next"
              onChangeText={handleChange("currentPassword")}
              value={values.currentPassword}
              onBlur={handleBlur("currentPassword")}
              error={touched.currentPassword ? errors.currentPassword : undefined}
              onSubmitEditing={() => newPasswordRef?.current?.focus()}
              blurOnSubmit={false}
              suffix={() => (
                <PasswordAccessory
                  open={currentPasswordVisible}
                  onPress={() => setCurrentPasswordVisible(!currentPasswordVisible)}
                />
              )}
            />

            <Box marginBottom="sm" />

            <TextInput
              editable={!isLoading}
              secureTextEntry={newPasswordVisible}
              label={fieldLabels.newPassword}
              placeholder={fieldLabels.newPassword}
              returnKeyType="next"
              onChangeText={handleChange("newPassword")}
              value={values.newPassword}
              ref={newPasswordRef}
              onBlur={handleBlur("newPassword")}
              error={touched.newPassword ? errors.newPassword : undefined}
              onSubmitEditing={() => confirmPasswordRef?.current?.focus()}
              blurOnSubmit={false}
              suffix={() => (
                <PasswordAccessory
                  open={newPasswordVisible}
                  onPress={() => setNewPasswordVisible(!newPasswordVisible)}
                />
              )}
            />

            <PasswordValidator value={values.newPassword} passwordValidateArr={passwordValidateArr} />

            <Box marginBottom="sm" />

            <Text variant="h7" fontWeight={"400"} color="black">
              {t("labels.validation_rules", {
                character: AppConstants.Config.Validation.passwordLength,
              })}
            </Text>

            <Box marginBottom="xxm" />

            <TextInput
              editable={!isLoading}
              secureTextEntry={confirmPasswordVisible}
              label={fieldLabels.confirmPassword}
              placeholder={t("labels.placeholder_confirm_password") ?? ""}
              returnKeyType="go"
              ref={confirmPasswordRef}
              onChangeText={handleChange("confirmPassword")}
              value={values.confirmPassword}
              onBlur={handleBlur("confirmPassword")}
              error={touched.confirmPassword ? errors.confirmPassword : undefined}
              onSubmitEditing={() => handleSubmit()}
              suffix={() => (
                <PasswordAccessory
                  open={confirmPasswordVisible}
                  onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                />
              )}
            />
          </Box>

          <FooterView>
            <Button
              label={t("actions.proceed")}
              variant="primary"
              size="medium"
              labelVariant="button"
              disabled={isLoading}
              onPress={handleSubmit}
            />
          </FooterView>
        </Box>

        <Loader visible={isLoading} />
      </Box>
    </PageView>
  );
}

const styles = StyleSheet.create({
  setPasswordWrapperStyle: {
    flexGrow: 1,
  },
});

export default SetPassword;
