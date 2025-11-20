import React, { useCallback, useEffect, useMemo } from "react";
import { StyleProp, ViewStyle } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { Box } from "../../../theme";
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
  onOptionSelected?: (option: "file") => void;
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

function FilePickerComponent({
  visible,
  onOptionSelected,
  onDismiss,
  onFileSelected,
  pickerOptions = {},
}: FilePickerProps) {
  const t = useFeatureTranslation("components.filePicker.");

  const options = useMemo(() => ({ ...imageSelectionOptions, ...pickerOptions }), [pickerOptions]);

  const openFilePicker = useCallback(async () => {
    onDismiss?.();

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
      .then((images) => {
        onOptionSelected?.("file");
        onFileSelected(images);
      })
      .catch((e) => {
        if (e.message?.includes(t("message.file_write_failed") ?? "")) {
          Toast.show(t("label.could_not_select_image"), { type: "error" });
        } else {
          Toast.show(e.message);
        }
      });
  }, [options, t, onDismiss, onOptionSelected, onFileSelected]);

  useEffect(() => {
    if (visible) {
      openFilePicker();
    }
  }, [visible, openFilePicker]);

  // Component doesn't render UI - it directly opens the file picker when visible
  return null;
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
