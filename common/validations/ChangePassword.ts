import * as yup from "yup";
import { useTranslation } from "react-i18next";

import { RegexExpression } from "./RegExp";

const passwordPattern = (value?: string) => RegexExpression.Password.test(value ?? "");

export const changePasswordSchema = (labels: Record<"currentPassword" | "newPassword" | "confirmPassword", string>) => {
  const { t } = useTranslation();

  return yup.object().shape({
    currentPassword: yup.string().required().label(labels.currentPassword),
    newPassword: yup.string().required().test("password-pattern", passwordPattern).label(labels.newPassword),
    confirmPassword: yup
      .string()
      .oneOf(
        [yup.ref("newPassword")],
        t("other.not_match", { field1: labels.confirmPassword, field2: "", ns: "validation" }) ?? ""
      )
      .required()
      .label(labels.confirmPassword),
  });
};
