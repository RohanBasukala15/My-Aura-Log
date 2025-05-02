import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Box, Text } from "../theme";

type TextVariant = React.ComponentProps<typeof Text>["variant"];
export interface GroupProps<Data> {
  data: Data[];
  selected?: Data;
  labelVariant?: TextVariant;
  onSelection?: (data: Data, index: number) => void;
  valueExtractor: (data: Data) => string;
  renderElement: (props: {
    data: Data;
    selected: boolean;
    onPress: () => void;
    labelVariant: TextVariant;
  }) => React.ReactNode;
}

type GroupValueType<Data> = { selected?: Data; data: Data[] };

const GroupContext = React.createContext<GroupValueType<unknown>>({ data: [] });

function Group<Data>({ 
  data, 
  selected = undefined, 
  onSelection = undefined, 
  renderElement, 
  valueExtractor, 
  labelVariant = undefined 
}: GroupProps<Data>) {
  const prevSelected = useRef<Data | undefined>(selected);
  const [selectedData, setSelected] = useState<Data | undefined>(selected);

  const onSelected = useCallback(
    (data: Data, index: number) => {
      setSelected(data);
      onSelection?.(data, index);
    },
    [onSelection]
  );

  const contextValue = useMemo(() => ({ selected: selectedData, data }), [selectedData, data]);

  useEffect(() => {
    if (prevSelected.current !== selected) {
      prevSelected.current = selected;
      setSelected(selected);
    }
  }, [selected]);

  return (
    <GroupContext.Provider value={contextValue}>
      <>
        {data.map((item, index) => {
          const key = valueExtractor(item);
          const selected = selectedData ? key === valueExtractor(selectedData) : false;
          return (
            <Box key={key}>
              {renderElement({
                data: item,
                labelVariant,
                selected,
                onPress: () => onSelected(item, index),
              })}
            </Box>
          );
        })}
      </>
    </GroupContext.Provider>
  );
}

export { Group };
