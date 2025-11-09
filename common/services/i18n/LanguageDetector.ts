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
      const fallbackLocale = Localization.getLocales()?.[0]?.languageCode;
      callback(locale ?? fallbackLocale ?? "en");
    });
  },
  cacheUserLanguage: (lng) => {
    Storage.setItem(AppConstants.StorageKey.appLanguage, lng).then().catch();
  },
};

export { LanguageDetector };
