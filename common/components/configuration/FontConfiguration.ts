import { useEffect, useState } from "react";
import * as Font from "expo-font";
import { Asset } from "expo-asset";
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  HankenGrotesk_100Thin,
  HankenGrotesk_200ExtraLight,
  HankenGrotesk_300Light,
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
  HankenGrotesk_900Black,
  HankenGrotesk_100Thin_Italic,
  HankenGrotesk_200ExtraLight_Italic,
  HankenGrotesk_300Light_Italic,
  HankenGrotesk_400Regular_Italic,
  HankenGrotesk_500Medium_Italic,
  HankenGrotesk_600SemiBold_Italic,
  HankenGrotesk_700Bold_Italic,
  HankenGrotesk_800ExtraBold_Italic,
  HankenGrotesk_900Black_Italic,
} from "@expo-google-fonts/hanken-grotesk";

import { initI18Next } from "../../services/i18n";

// Local font file
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PacificoRegular = require("../theme/fonts/Pacifico-Regular.ttf");

export type FontSource = Parameters<typeof Font.loadAsync>[0];
const usePromiseAll = (
  promises: Promise<void | void[] | Asset[]>[],
  unsafePromises: Promise<unknown>[],
  callback: () => void
) =>
  useEffect(() => {
    (async () => {
      await Promise.all(promises);
      try {
        await Promise.all(unsafePromises);
      } catch (e) {
        // do nothing
      }
      callback();
    })();
  });

export const useLoadAssets = (assets: readonly number[], fonts: FontSource): boolean => {
  const [ready, setReady] = useState(false);
  usePromiseAll([Font.loadAsync(fonts), ...assets.map(Asset.loadAsync)], [initI18Next()], () => setReady(true));
  return ready;
};

export const appFonts = Object.freeze({
  HankenGrotesk_100Thin,
  HankenGrotesk_200ExtraLight,
  HankenGrotesk_300Light,
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
  HankenGrotesk_900Black,
  HankenGrotesk_100Thin_Italic,
  HankenGrotesk_200ExtraLight_Italic,
  HankenGrotesk_300Light_Italic,
  HankenGrotesk_400Regular_Italic,
  HankenGrotesk_500Medium_Italic,
  HankenGrotesk_600SemiBold_Italic,
  HankenGrotesk_700Bold_Italic,
  HankenGrotesk_800ExtraBold_Italic,
  HankenGrotesk_900Black_Italic,
  Pacifico: PacificoRegular,
});

export enum AppFonts {
  Thin_100 = "HankenGrotesk_100Thin",
  ExtraLight_200 = "HankenGrotesk_200ExtraLight",
  Light_300 = "HankenGrotesk_300Light",
  Regular_400 = "HankenGrotesk_400Regular",
  Medium_500 = "HankenGrotesk_500Medium",
  SemiBold_600 = "HankenGrotesk_600SemiBold",
  Bold_700 = "HankenGrotesk_700Bold",
  ExtraBold_800 = "HankenGrotesk_800ExtraBold",
  Black_900 = "HankenGrotesk_900Black",
  Thin_Italic_100 = "HankenGrotesk_100Thin_Italic",
  ExtraLight_Italic_200 = "HankenGrotesk_200ExtraLight_Italic",
  Light_Italic_300 = "HankenGrotesk_300Light_Italic",
  Regular_Italic_400 = "HankenGrotesk_400Regular_Italic",
  Medium_Italic_500 = "HankenGrotesk_500Medium_Italic",
  SemiBold_Italic_600 = "HankenGrotesk_600SemiBold_Italic",
  Bold_Italic_700 = "HankenGrotesk_700Bold_Italic",
  ExtraBold_Italic_800 = "HankenGrotesk_800ExtraBold_Italic",
  Black_Italic_900 = "HankenGrotesk_900Black_Italic",
  Pacifico = "Pacifico",
}
