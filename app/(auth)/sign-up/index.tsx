import React from "react";

import { Text, Box, PageView, HeaderView } from "@common/components";

export default function SignUp() {
  return (
    <PageView statusBarStyle="dark">
      <>
        <HeaderView disabled={false} />
        <Text variant="h2" fontWeight={"500"} color="black">
          Sign Up
        </Text>
      </>
    </PageView>
  );
}
