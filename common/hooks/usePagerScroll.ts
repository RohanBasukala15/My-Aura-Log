import { NativeSyntheticEvent } from "react-native";
import { useEvent, useHandler } from "react-native-reanimated";
import type { PagerViewOnPageScrollEventData } from "react-native-pager-view";

type HandlerDependencies = Array<unknown> | undefined;

export type BubblingEventHandler<T, PaperName extends string | never = never> = (
  event: NativeSyntheticEvent<T>
) => void | Promise<void>;

export function usePagerScrollHandler(
  handlers: {
    onPageScroll: (event: PagerViewOnPageScrollEventData, context: object) => void;
  },
  dependencies?: HandlerDependencies
) {
  const normalizedDependencies = dependencies ?? [];
  const { context, doDependenciesDiffer } = useHandler(handlers, normalizedDependencies as HandlerDependencies);
  const subscribeForEvents = ["onPageScroll"];

  return useEvent<PagerViewOnPageScrollEventData & { eventName: string }>(
    (event) => {
      "worklet";
      const { onPageScroll } = handlers;
      if (onPageScroll && event.eventName.endsWith("onPageScroll")) {
        onPageScroll(event as never, context);
      }
    },
    subscribeForEvents,
    doDependenciesDiffer
  ) as never as BubblingEventHandler<PagerViewOnPageScrollEventData>;
}
