import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";

export default function Gallery() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Stack.Screen options={{ title: "Gallery", headerShown: true }} />
      <Text>Gallery</Text>

      <View style={{ margin: 12 }}>
        <Link href="../">Go Back</Link>
      </View>
    </View>
  );
}
