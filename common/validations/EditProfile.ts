import * as yup from "yup";

export const editProfileSchema = (labels: Record<"email", string>) => {
  return yup.object().shape({
    email: yup.string().email().required().label(labels.email),
  });
};
