/**
 * Contains hooks functions that are relevant to the i18 translation
 * Don`t modify
 */
import React from "react";
import { KeyPrefix, Namespace, TFunction } from "i18next";
import { UseTranslationOptions, useTranslation } from "react-i18next";

export function useFeatureTranslation<N extends Namespace = "translation", TKPrefix extends KeyPrefix<N> = undefined>(
  feature: string,
  ns?: N | Readonly<N>,
  options?: UseTranslationOptions<TKPrefix>
): TFunction<N, TKPrefix, N extends null ? "translation" : N> {
  const { t } = useTranslation(ns, options);

  return React.useCallback(
    ((key: Parameters<typeof t>[0], options?: Parameters<typeof t>[1]) =>
      t(feature + key, options as never)) as TFunction<N, TKPrefix, N extends null ? "translation" : N>,

    [t, feature]
  );
}
