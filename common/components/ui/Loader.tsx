import React from "react";
import { Modal, View } from "react-native";

import { Text, ActivityIndicator } from "../theme";

interface LoaderProps {
  visible?: boolean;
  message?: string;
}

function Loader(props: LoaderProps) {
  const { message, visible } = props;

  if (!visible) {
    return null;
  }
  return (
    <Modal transparent statusBarTranslucent onRequestClose={() => null} visible={visible}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0, 0.45)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View style={{ borderRadius: 10, backgroundColor: "white", padding: 18 }}>
          <Text style={{ fontSize: 14, fontWeight: "200", marginBottom: 8 }}>{message || "Loading..."}</Text>
          <ActivityIndicator style={{ marginTop: 8 }} />
        </View>
      </View>
    </Modal>
  );
}

Loader.defaultProps = {
  visible: false,
  message: "",
};

export { Loader };
