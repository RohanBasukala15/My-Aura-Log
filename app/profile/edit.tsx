import React, { useMemo, useState, useEffect } from "react";
import { TouchableWithoutFeedback, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useFormik } from "formik";
import { MediaTypeOptions } from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useFormikErrors } from "@common/hooks";
import { editProfileSchema } from "@common/validations";
import { useFeatureTranslation } from "@common/services/i18n";
import {
  Box,
  Button,
  HeaderView,
  HeaderTitleDesc,
  PageView,
  TextInput,
  useTheme,
  Loader,
  FilePicker,
  ImageTitle,
  FooterView,
} from "@common/components";
import { useAppSelector, userActions, useAppDispatch } from "@common/redux";
import { Toast } from "@common/utils";

function EditProfile() {
  const { userDetails } = useAppSelector((state) => state.user);
  const { isLoading, isSuccess, error } = useAppSelector((state) => state.user.editProfile);

  const [isFilePickerVisible, setIsFilePickerVisible] = useState(false);

  const theme = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const t = useFeatureTranslation("screens.edit_profile.");

  const labels = useMemo(
    () => ({
      name: t("labels.name"),
      mobileNumber: t("labels.mobile_number"),
      email: t("labels.email"),
    }),
    [t]
  );

  const formik = useFormik({
    validationSchema: editProfileSchema(labels),
    initialValues: {
      name: [userDetails?.firstName, userDetails?.lastName].filter(Boolean).join(" "),
      email: userDetails?.email,
    },
    onSubmit: (values) => {
      const obj = {
        email: values.email ?? "",
      };

      dispatch(userActions.editProfile(obj));
    },
  });
  const { errors } = useFormikErrors(formik);

  useEffect(() => {
    if (isSuccess) {
      router.back();
    }

    if (error) {
      Toast.show((error as Error)?.message, { type: "error" });
    }

    dispatch(userActions.clearEditProfileSliceState());
  }, [isSuccess, error]);

  return (
    <FilePicker
      pickerOptions={{
        allowsMultipleSelection: false,
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true,
      }}
      visible={isFilePickerVisible}
      onFileSelected={(files) => {
        // TODO
      }}
      onDismiss={() => setIsFilePickerVisible(false)}
    >
      <PageView statusBarStyle="dark" type="KeyboardAwareScrollView">
        <Box flex={1}>
          <HeaderView backActionVisible />
          <HeaderTitleDesc title={t("titles.heading")} description={t("titles.subHeading")} />

          <Box flex={1} justifyContent={"space-between"} paddingTop="l">
            <Box>
              <Box alignItems="center">
                <Box>
                  {userDetails?.profileImage ? (
                    <Image
                      source={{ uri: userDetails.profileImage }}
                      placeholder={require("@common/assets/placeholders/user_profile.png")}
                      style={styles.profileImage}
                    />
                  ) : (
                    <ImageTitle
                      containerStyle={styles.profileImage}
                      textStyle={{ fontSize: theme.spacing.xxxl }}
                      name={`${userDetails?.firstName} ${userDetails?.lastName}`}
                    />
                  )}

                  <Box
                    right={0}
                    bottom={0}
                    position="absolute"
                    style={{ transform: [{ translateX: 5 }, { translateY: 5 }] }}
                  >
                    <TouchableWithoutFeedback onPress={() => setIsFilePickerVisible(true)}>
                      <Box
                        borderWidth={2}
                        borderRadius="m"
                        width={35}
                        height={35}
                        alignItems="center"
                        justifyContent="center"
                        borderColor="borderDisabled"
                        backgroundColor="surfaceDefault"
                      >
                        <MaterialCommunityIcons name="camera" size={25} color={theme.colors.primary} />
                      </Box>
                    </TouchableWithoutFeedback>
                  </Box>
                </Box>
              </Box>

              <Box marginVertical="m" />

              <Box>
                <TextInput
                  editable={false}
                  label={labels.name}
                  error={errors.name}
                  value={formik.values.name}
                  onBlur={formik.handleBlur("name")}
                  onChangeText={formik.handleChange("name")}
                />

                <TextInput
                  editable={!isLoading}
                  label={labels.email}
                  error={errors.email}
                  value={formik.values.email}
                  onBlur={formik.handleBlur("email")}
                  onChangeText={formik.handleChange("email")}
                />
              </Box>
            </Box>
            <FooterView>
              <Button disabled={isLoading} variant="primary" label={t("actions.save")} onPress={formik.handleSubmit} />
            </FooterView>
          </Box>

          <Loader visible={isLoading} />
        </Box>
      </PageView>
    </FilePicker>
  );
}

const useStyles = () => {
  const theme = useTheme();

  return StyleSheet.create({
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: theme.borderRadii.sm,
    },
  });
};

export default EditProfile;
