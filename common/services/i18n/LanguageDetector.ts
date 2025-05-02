import { LanguageDetectorAsyncModule } from "i18next";
import * as Localization from "expo-localization";

import { Storage } from "../Storage";
import AppConstants from "../../assets/AppConstants";

const LanguageDetector: LanguageDetectorAsyncModule = {
  async: true,
  type: "languageDetector",
  init: () => {
    /* do nothing */
  },
  detect: (callback) => {
    Storage.getItem<string>(AppConstants.StorageKey.appLanguage).then((locale) => {
      callback(locale ?? Localization.getLocales()?.[0]?.languageCode);
    });
  },
  cacheUserLanguage: (lng) => {
    Storage.setItem(AppConstants.StorageKey.appLanguage, lng).then().catch();
  },
};

export { LanguageDetector };
