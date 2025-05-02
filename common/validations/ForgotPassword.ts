import { useTranslation } from "react-i18next";
import * as yup from "yup";

import AppConstants from "../assets/AppConstants";

import { RegexExpression } from "./RegExp";

const digitsOnly = (value?: string) => RegexExpression.NumbersOnly.test(value ?? "");

export const useForgotPasswordSchema = (labels: Record<"mobileNumber", string>) => {
  const { t } = useTranslation();
  return yup.object().shape({
    countryCode: yup.object().required(),
    mobileNumber: yup
      .string()
      .required()
      .test("digits-only", digitsOnly)
      .test("country-validation", (value, context) => {
        const countryCode = context.parent.countryCode;
        if (!value) {
          return true;
        }
        if (countryCode.min_length && value.length < countryCode.min_length) {
          return context.createError({
            path: context.path,

            message:
              t("string.min", {
                ns: "validation",
              })?.replace("${min}", countryCode.min_length) ?? "",
          });
        } else if (countryCode.max_length && value.length > countryCode.max_length) {
          return context.createError({
            path: context.path,

            message:
              t("string.max", {
                ns: "validation",
              })?.replace("${max}", countryCode.max_length) ?? "",
          });
        } else if (countryCode.pattern) {
          const newRegex = new RegExp(countryCode.pattern);
          if (newRegex.test(value)) {
            return true;
          } else {
            context.createError({
              path: context.path,
              message:
                t("string.matches", {
                  ns: "validation",
                })?.replace("${regex}", countryCode.pattern) ?? "",
            });
          }
        }

        return true;
      })
      .label(labels.mobileNumber),
  });
};
