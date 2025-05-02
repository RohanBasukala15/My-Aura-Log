import * as yup from "yup";

export const useLoginSchema = (labels: Record<"email" | "password", string>) => {
  return yup.object().shape({
    email: yup.string().email().required().label(labels.email),
    password: yup.string().required().label(labels.password),
  });
};
