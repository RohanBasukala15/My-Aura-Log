import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { RectButton } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps } from "@gorhom/bottom-sheet";

import { Box, Text, useTheme } from "../../../theme";
import { useFeatureTranslation } from "../../../../services/i18n";

import { Toast } from "@common/utils";

export interface ImageInfo extends ImagePicker.ImagePickerAsset {
  fileType: string;
  extension?: string;
}

const imageSelectionOptions: ImagePicker.ImagePickerOptions = {
  quality: 1,
  base64: true,
  exif: true,
  allowsMultipleSelection: false,
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
};

export interface FilePickerProps {
  visible: boolean;
  onOptionSelected?: (option: "camera" | "file") => void;
  onDismiss?: () => void;
  onFileSelected: (response: ImageInfo[]) => void;
  pickerOptions?: ImagePicker.ImagePickerOptions;
}

async function mapFileSelectionResult(rawImages: ImagePicker.ImagePickerAsset[]): Promise<ImageInfo[]> {
  const imageInfoList = [];
  for (const rawImageInfo of rawImages) {
    const fileName = rawImageInfo.fileName ?? rawImageInfo.uri.split("/").pop() ?? "";
    const match = /\.(\w+)$/.exec(fileName);
    const base64 = rawImageInfo.base64;
    const extension = match?.[1];
    const fileType = match ? `image/${match[1]}` : "image";
    const imageInfo = {
      ...rawImageInfo,
      fileType,
      extension,
      fileName,
      base64,
    };

    imageInfoList.push(imageInfo);
  }

  return imageInfoList;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  selectionText: { marginVertical: 12, fontSize: 16 },
  pickerOptionContainer: {
    flex: 1,
    flexDirection: "row",
  },
  shadowContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
});

function BackdropView(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop opacity={0.7} appearsOnIndex={0} disappearsOnIndex={-1} {...props} />;
}

function FilePickerComponent({
  visible,
  onOptionSelected,
  onDismiss,
  onFileSelected,
  pickerOptions = {},
}: FilePickerProps) {
  const theme = useTheme();
  const t = useFeatureTranslation("components.filePicker.");

  const snapPoints = useMemo(() => ["25%"], []);
  const bottomSheetRef = useRef<BottomSheet | null>(null);

  const [isPickerVisible, setPickerVisible] = useState(visible);

  const options = useMemo(() => ({ ...imageSelectionOptions, ...pickerOptions }), [pickerOptions]);

  const closePicker = useCallback(() => {
    bottomSheetRef.current?.close();
    onDismiss?.();
  }, [onDismiss, bottomSheetRef]);

  const openPicker = useCallback(() => {
    Keyboard.dismiss();
    bottomSheetRef.current?.snapToIndex(0);
  }, [bottomSheetRef]);

  useEffect(() => {
    if (visible === isPickerVisible) {
      return;
    }
    setPickerVisible(visible);
    if (visible) {
      openPicker();
    } else {
      closePicker();
    }
  }, [visible, isPickerVisible, closePicker, openPicker]);

  function openCamera() {
    closePicker();

    ImagePicker.getCameraPermissionsAsync()
      .then((result) => {
        if (!result.granted) {
          return ImagePicker.requestCameraPermissionsAsync();
        }
        return Promise.resolve(result);
      })
      .then((result) => {
        if (result.granted) {
          return ImagePicker.launchCameraAsync(options);
        }
        return Promise.reject(new Error(`Camera permission ${result.status} by user`));
      })
      .then((response) => {
        if (response.canceled || !response.assets || response.assets?.length <= 0) {
          return Promise.reject(new Error(t("message.image_cancelled") ?? ""));
        }
        return response.assets;
      })
      .then(mapFileSelectionResult)
      .then(onFileSelected)
      .catch((e) => {
        Toast.show(e.message, { type: "error" });
      });
  }

  async function openFilePicker() {
    closePicker();

    ImagePicker.getMediaLibraryPermissionsAsync()
      .then((result) => {
        if (!result.granted) {
          return ImagePicker.requestMediaLibraryPermissionsAsync();
        }
        return Promise.resolve(result);
      })
      .then((result) => {
        if (result.granted) {
          return ImagePicker.launchImageLibraryAsync(options);
        }
        return Promise.reject(new Error(`Media permission ${result.status} by user`));
      })
      .then((response) => {
        if (response.canceled || !response.assets || response.assets?.length <= 0) {
          return Promise.reject(new Error(t("message.media_cancelled") ?? ""));
        }
        return response.assets;
      })
      .then(mapFileSelectionResult)
      .then(onFileSelected)
      .catch((e) => {
        if (e.message?.includes(t("message.file_write_failed") ?? "")) {
          Toast.show(t("label.could_not_select_image"), { type: "error" });
        } else {
          Toast.show(e.message);
        }
      });
  }

  return (
    <BottomSheet
      style={styles.flex}
      onClose={onDismiss}
      ref={bottomSheetRef}
      enablePanDownToClose
      snapPoints={snapPoints}
      index={isPickerVisible ? 0 : -1}
      backdropComponent={BackdropView}
      backgroundStyle={{ backgroundColor: theme.colors.surfaceDefault }}
    >
      <Box flex={1} paddingHorizontal="m" backgroundColor="surfaceDefault">
        <Text>{t("label.select_option")}</Text>
        <View style={styles.pickerOptionContainer}>
          <RectButton
            style={styles.flex}
            onPress={() => {
              onOptionSelected?.("camera");
              openCamera();
            }}
          >
            <View style={[styles.flex, styles.center]}>
              <FontAwesome size={32} name="camera" color={theme.colors.primary} />
              <Text style={styles.selectionText}>{t("label.camera")}</Text>
            </View>
          </RectButton>

          <RectButton
            style={styles.flex}
            onPress={() => {
              onOptionSelected?.("file");
              openFilePicker();
            }}
          >
            <View style={[styles.flex, styles.center]}>
              <FontAwesome size={32} name="file-text" color={theme.colors.primary} />
              <Text style={styles.selectionText}>{t("label.files")}</Text>
            </View>
          </RectButton>
        </View>
      </Box>
    </BottomSheet>
  );
}

export function FilePicker({
  children,
  containerStyle,
  ...props
}: FilePickerProps &
  React.PropsWithChildren<{
    containerStyle?: StyleProp<ViewStyle>;
  }>) {
  return (
    <Box flex={1} style={[containerStyle]}>
      {children}
      <FilePickerComponent {...props} />
    </Box>
  );
}
