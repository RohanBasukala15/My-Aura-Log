import React from "react";
import { ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";

import { useFeatureTranslation } from "@common/services/i18n";

function Dashboard() {
  const t = useFeatureTranslation("screens.dashboard.");

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <>
        <StatusBar style="inverted" />
      </>
    </ScrollView>
  );
}

export default Dashboard;
