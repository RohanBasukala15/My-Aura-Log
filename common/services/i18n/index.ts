import i18next, { InitOptions } from "i18next";
import { initReactI18next } from "react-i18next";

import * as utils from "./utils";
import { LanguageDetector } from "./LanguageDetector";
import { buildYupLocale } from "./YupValidationLocale";

const defaultOptions: InitOptions = {
  resources: {
    en: {
      network: require("./sources/en/network.json"),
      validation: require("./sources/en/validation.json"),
      translation: require("./sources/en/translation.json"),
    },
  },
  compatibilityJSON: "v3",
  fallbackLng: "en",
  defaultNS: "translation",
  interpolation: {
    escapeValue: false,
  },
};

const initI18Next = (option: InitOptions = {}) =>
  i18next.use(initReactI18next).use(LanguageDetector).init(utils.defaults(option, defaultOptions), buildYupLocale);

export { initI18Next };
export * from "./hooks";
export * from "./utils";
