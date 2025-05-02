import * as yup from "yup";
import { useTranslation } from "react-i18next";

import { RegexExpression } from "./RegExp";

const passwordPattern = (value?: string) => RegexExpression.Password.test(value ?? "");

export const setPasswordSchema = (labels: Record<"password" | "confirmPassword", string>) => {
  const { t } = useTranslation();

  return yup.object().shape({
    password: yup.string().required().test("password-pattern", passwordPattern).label(labels.password),
    confirmPassword: yup
      .string()
      .oneOf(
        [yup.ref("password")],
        t("other.not_match", { field1: labels.confirmPassword, field2: "", ns: "validation" }) ?? ""
      )
      .required()
      .label(labels.confirmPassword),
  });
};
