/* eslint-disable @typescript-eslint/no-explicit-any, no-template-curly-in-string, no-useless-concat */
import * as Yup from "yup";
import { TFunction } from "i18next";
import { LocaleObject } from "yup";

function printValue(value: unknown, quoteStrings?: boolean): string {
  return value?.toString() ?? "";
}

const localeKeys = {
  mixed: ["default", "required", "defined", "notNull", "oneOf", "notOneOf"],
  string: ["length", "max", "min", "matches", "email", "url", "uuid", "trim", "lowercase", "uppercase"],
  number: ["max", "min", "lessThan", "moreThan", "positive", "negative", "integer"],
  date: ["min", "max"],
  boolean: ["isValue"],
  object: ["noUnknown"],
  array: ["min", "max", "length"],
};

type LocaleKeys = keyof LocaleObject;

function getRuleMessage(t: TFunction): LocaleObject {
  const localeObj: LocaleObject = {};

  Object.entries(localeKeys).forEach(([type, keys]) => {
    localeObj[type as LocaleKeys] = {};
    keys.forEach((key) => {
      localeObj[type as never][key as never] = t(`${type}.${key}`, { ns: "validation" });
    });
  });
  return localeObj;
}

/**
 * Builds the Yup Locale
 */
export function buildYupLocale(_: unknown, t: TFunction): void {
  const localeObject: LocaleObject = getRuleMessage(t);
  localeObject.mixed!.notType = ({ path, type, value, originalValue }) => {
    const castMsg =
      originalValue != null && originalValue !== value
        ? t("mixed.notType_castMsg", { ns: "validation", printValue: printValue(value) }) ?? ""
        : ".";

    return type !== "mixed"
      ? t("mixed.notType_mixed", { ns: "validation", path, type, printValue: printValue(value), castMsg }) ?? ""
      : t("mixed.notType_not_mixed", { ns: "validation", path, printValue: printValue(value), castMsg }) ?? "";
  };
  Yup.setLocale(localeObject);
}
