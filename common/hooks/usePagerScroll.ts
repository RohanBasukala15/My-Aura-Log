import { DependencyList } from "react";
import { NativeSyntheticEvent } from "react-native";
import { useEvent, useHandler } from "react-native-reanimated";
import { OnPageScrollEventData } from "react-native-pager-view/lib/typescript/PagerViewNativeComponent";

export type BubblingEventHandler<T, PaperName extends string | never = never> = (
  event: NativeSyntheticEvent<T>
) => void | Promise<void>;

export function usePagerScrollHandler(
  handlers: {
    onPageScroll: (event: OnPageScrollEventData, context: object) => void;
  },
  dependencies?: DependencyList
) {
  const { context, doDependenciesDiffer } = useHandler(handlers, dependencies);
  const subscribeForEvents = ["onPageScroll"];

  return useEvent<OnPageScrollEventData & { eventName: string }>(
    (event) => {
      "worklet";
      const { onPageScroll } = handlers;
      if (onPageScroll && event.eventName.endsWith("onPageScroll")) {
        onPageScroll(event as never, context);
      }
    },
    subscribeForEvents,
    doDependenciesDiffer
  ) as never as BubblingEventHandler<OnPageScrollEventData>;
}
