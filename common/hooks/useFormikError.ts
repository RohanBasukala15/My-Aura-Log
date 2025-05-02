import React from "react";
import { FormikErrors } from "formik/dist/types";
import { FormikConfig, FormikValues, useFormik } from "formik";

class FormikInstance<Values extends FormikValues = FormikValues> {
  formik(config: FormikConfig<Values>) {
    return useFormik<Values>(config);
  }
}

export type Formik<V extends FormikValues = FormikValues> = ReturnType<FormikInstance<V>["formik"]>;

export function useFormikErrors<T extends FormikValues>(formik: Formik<T>, options?: { ignoreError?: (keyof T)[] }) {
  return React.useMemo(() => {
    const errors: FormikErrors<T> = {};

    Object.entries(formik.touched).forEach(([name, touched]) => {
      if (touched) {
        errors[name as keyof T] = formik.errors[name as keyof T];
      }
    });

    const touched = Object.entries(formik.touched).filter(
      ([key, touched]) => touched && !options?.ignoreError?.includes(key)
    );

    return {
      errors,
      hasError: touched.length ? touched.some(([key]) => formik.errors[key as keyof T] !== undefined) : false,
    };
  }, [formik.touched, formik.errors]);
}
