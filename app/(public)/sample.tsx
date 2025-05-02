import React, { useCallback, useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { ColorValue } from "react-native";

import { Box, Text, Button, Group, Checkbox, RadioButton, TextInput, ActivityIndicator } from "@common/components";

function ClearAffix({ color }: Partial<{ color: ColorValue; size: number }>) {
  return (
    <Box paddingHorizontal="xxs">
      <MaterialIcons
        name="cancel"
        color={color}
        size={16}
        onPress={() => {
          // console.log("OnCancelled Pressed");
        }}
      />
    </Box>
  );
}

function SearchAffix({ color, size }: Partial<{ color: ColorValue; size: number }>) {
  return (
    <Box paddingHorizontal="xxs">
      <MaterialIcons name="search" color={color} size={size ?? 16} />
    </Box>
  );
}

function ExchangeAffix({ color, size }: Partial<{ color: ColorValue; size: number }>) {
  return <MaterialCommunityIcons name="compare-vertical" color={color} size={size} />;
}

export default function Sample() {
  const [isSelectedCheckbox, setSelectedCheckbox] = useState(false);
  const [isSelectedRadioButton, setSelectedRadioButton] = useState(false);

  const sortByAffix = useCallback(
    ({ color }: Partial<{ color: ColorValue }>) => (
      <Text style={{ color }} paddingHorizontal="xxs">
        Sort By
      </Text>
    ),
    []
  );

  return (
    <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Box flex={1} padding="m" backgroundColor={"white"}>
        <Box>
          <Text variant="h2">1. Typography</Text>

          <Box padding="m" borderWidth={2} borderRadius="xs" marginVertical="m" borderColor="borderDefault">
            <Text variant="h1" marginVertical="xxs">
              H1 (title)
            </Text>
            <Text variant="h2" marginVertical="xxs">
              H2 (title)
            </Text>
            <Text variant="h3" marginVertical="xxs">
              H3 (title)
            </Text>
            <Text variant="h4" marginVertical="xxs">
              H3 (title)
            </Text>
            <Text variant="h6" marginVertical="xxs">
              h6
            </Text>
            <Text variant="button" marginVertical="xxs">
              Button Text
            </Text>
            <Text variant="default" marginVertical="xxs">
              Body
            </Text>
            <Text variant="labels" marginVertical="xxs">
              Labels
            </Text>
            <Text variant="caption" marginVertical="xxs">
              Caption
            </Text>
          </Box>
        </Box>

        <Box>
          <Text variant="h2">2. Input Fields</Text>
          <Box padding="m" borderWidth={2} borderRadius="xs" marginVertical="m" borderColor="borderDefault">
            <Box marginVertical="xxs">
              <TextInput label="Normal Input" returnKeyType="done" />

              <TextInput
                editable={false}
                defaultValue="Some Input Value"
                label="Normal Input Disabled"
                returnKeyType="done"
              />

              <TextInput returnKeyType="done" label="Normal Input with Helper" helper="helper messages" />

              <TextInput returnKeyType="done" label="Normal Input with Error" error="error messages" />

              <TextInput
                returnKeyType="done"
                label="Input with Prefix"
                defaultValue="testing@sample.com"
                prefix={sortByAffix}
              />

              <TextInput
                returnKeyType="done"
                label="Input with Affix"
                placeholder="Search"
                prefix={SearchAffix}
                suffix={ClearAffix}
              />
            </Box>

            <Box>
              <Text variant="labels">Select an item</Text>
            </Box>

            <Box>
              <Text variant="labels">Select a language</Text>
            </Box>
          </Box>
        </Box>

        <Box>
          <Box>
            <Text variant="h2">3. Checkbox</Text>
            <Box padding="m" borderWidth={2} borderRadius="xs" marginVertical="m" borderColor="borderDefault">
              <Checkbox
                selected={isSelectedCheckbox}
                title="Remember me"
                subtitle="Save my login details for next time."
                onPress={() => setSelectedCheckbox(!isSelectedCheckbox)}
              />

              <Box marginVertical="xxs" />

              <Box flexDirection="row">
                <Box flex={1}>
                  <Checkbox title="Label" />
                </Box>
                <Box flex={1}>
                  <Checkbox selected title="Label" />
                </Box>
              </Box>

              <Box flexDirection="row">
                <Box flex={1}>
                  <Checkbox disabled title="Label" />
                </Box>
                <Box flex={1}>
                  <Checkbox selected disabled title="Label" />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box>
          <Box>
            <Text variant="h2">3. RadioButton</Text>
            <Box padding="m" borderWidth={2} borderRadius="xs" marginVertical="m" borderColor="borderDefault">
              <RadioButton
                selected={isSelectedRadioButton}
                title="Remember me"
                subtitle="This is what happens when selected."
                onPress={() => setSelectedRadioButton(!isSelectedRadioButton)}
              />

              <Box marginVertical="xxs" />

              <Box flexDirection="row">
                <Box flex={1}>
                  <RadioButton title="Label" />
                </Box>
                <Box flex={1}>
                  <RadioButton selected title="Label" />
                </Box>
              </Box>

              <Box flexDirection="row">
                <Box flex={1}>
                  <RadioButton disabled title="Label" />
                </Box>
                <Box flex={1}>
                  <RadioButton selected disabled title="Label" />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box>
          <Box>
            <Text variant="h2">3. Button</Text>
            <Box padding="m" borderWidth={2} borderRadius="xs" marginVertical="m" borderColor="borderDefault">
              <Button loading label="Plain" variant="destructive" />

              <Box marginVertical="xxs" />

              <Button label="Plain" variant="plain" />

              <Box marginVertical="xxs" />

              <Box marginVertical="xxs" />

              <Box marginVertical="xxs" />

              <Button disabled label="Plain Disabled" variant="plain" />

              <Box marginVertical="xxs" />

              <Button label="Primary" variant="primary" prefix={ExchangeAffix} />

              <Box marginVertical="xxs" />

              <Button depressed label="Primary Depressed" variant="primary" prefix={ExchangeAffix} />

              <Box marginVertical="xxs" />

              <Button disabled label="Primary Disabled" variant="primary" prefix={ExchangeAffix} />

              <Box marginVertical="xxs" />

              <Button label="Destructive" variant="destructive" suffix={SearchAffix} />

              <Box marginVertical="xxs" />

              <Button depressed label="Destructive Depressed" variant="destructive" suffix={SearchAffix} />

              <Box marginVertical="xxs" />

              <Button disabled label="Destructive Disabled" variant="destructive" suffix={SearchAffix} />

              <Box marginVertical="xxs" />

              <Button label="Outline" variant="outline" />

              <Box marginVertical="xxs" />

              <Button depressed label="Outline Depressed" variant="outline" />

              <Box marginVertical="xxs" />

              <Button disabled label="Outline Disabled" variant="outline" />

              <Box marginVertical="xxs" />

              <Button label="Outline Monochrome" variant="outlineMonochrome" />

              <Box marginVertical="xxs" />

              <Button depressed label="Outline Monochrome Depressed" variant="outlineMonochrome" />

              <Box marginVertical="xxs" />

              <Button disabled label="Outline Monochrome Disabled" variant="outlineMonochrome" />
            </Box>
          </Box>
        </Box>

        <Box>
          <Box marginVertical="m">
            <Text variant="h2">5. Badge</Text>
          </Box>
          <Box>
            <Text variant="h2">5.1. Urgency Badge</Text>
            <Box padding="m" borderWidth={2} borderRadius="xs" marginVertical="m" borderColor="borderDefault">
              <Box marginVertical="xxs" />

              <Box flexDirection="row">
                <Box flex={0.8} margin="xs" justifyContent="center">
                  <Text>High</Text>
                </Box>
                <Box flex={1} margin="xs"></Box>
                <Box flex={1} margin="xs"></Box>
                <Box flex={1}></Box>
              </Box>

              <Box flexDirection="row">
                <Box flex={0.8} margin="xs" justifyContent="center">
                  <Text>Medium</Text>
                </Box>
                <Box flex={1} margin="xs"></Box>
                <Box flex={1} margin="xs"></Box>
                <Box flex={1} margin="xs"></Box>
              </Box>

              <Box flexDirection="row">
                <Box flex={0.8} margin="xs" justifyContent="center">
                  <Text>Urgent</Text>
                </Box>
                <Box flex={1} margin="xs"></Box>
                <Box flex={1} margin="xs"></Box>
                <Box flex={1} margin="xs"></Box>
              </Box>
            </Box>
          </Box>

          <Box>
            <Text variant="h2">5.2. Status Badge</Text>
            <Box padding="m" borderWidth={2} borderRadius="xs" marginVertical="m" borderColor="borderDefault">
              <Box marginVertical="xxs" />

              <Box flexDirection="row">
                <Box flex={1} margin="xs" justifyContent="center">
                  <Text>Pending</Text>
                </Box>
                <Box flex={1} margin="xs"></Box>
                <Box flex={1} margin="xs"></Box>
                <Box flex={1}></Box>
              </Box>

              <Box flexDirection="row">
                <Box flex={1} margin="xs" justifyContent="center">
                  <Text>InProgress</Text>
                </Box>
                <Box flex={1} margin="xs"></Box>
                <Box flex={1} margin="xs"></Box>
                <Box flex={1} margin="xs"></Box>
              </Box>

              <Box flexDirection="row">
                <Box flex={1} margin="xs" justifyContent="center">
                  <Text>Scheduled</Text>
                </Box>
                <Box flex={1} margin="xs"></Box>
                <Box flex={1} margin="xs"></Box>
                <Box flex={1} margin="xs"></Box>
              </Box>

              <Box flexDirection="row">
                <Box flex={1} margin="xs" justifyContent="center">
                  <Text>Completed</Text>
                </Box>
                <Box flex={1} margin="xs"></Box>
                <Box flex={1} margin="xs"></Box>
                <Box flex={1} margin="xs"></Box>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box>
          <Box>
            <Text variant="h2">6. Toggles</Text>
            <Box padding="m" borderWidth={2} borderRadius="xs" marginVertical="m" borderColor="borderDefault">
              <Box marginVertical="xxs" />

              <Text variant="h6">Toggle Group</Text>

              <Box flexDirection="row">
                <Group<string>
                  data={["Toggle 1", "Toggle 2"]}
                  valueExtractor={(item) => item}
                  renderElement={() => <Box padding="xxs" key={`key`}></Box>}
                />
              </Box>

              <Box marginVertical="xxs" />

              <Box flexDirection="row" justifyContent="center">
                <Box flex={1}></Box>

                <Box padding="xxs" />

                <Box flex={1}></Box>

                <Box padding="xxs" />

                <Box flex={1}></Box>
              </Box>

              <Box marginVertical="xxs" />

              <Box flexDirection="row" justifyContent="center">
                <Box flex={1}></Box>

                <Box padding="xxs" />

                <Box flex={1}></Box>

                <Box padding="xxs" />

                <Box flex={1}></Box>
              </Box>

              <Box marginVertical="xxs" />

              <Box flexDirection="row" justifyContent="center">
                <Box flex={1}></Box>

                <Box padding="xxs" />

                <Box flex={1}></Box>

                <Box padding="xxs" />

                <Box flex={1}></Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </KeyboardAwareScrollView>
  );
}

