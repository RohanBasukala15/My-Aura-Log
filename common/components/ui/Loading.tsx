import React from "react";

import { Box, ActivityIndicator, useTheme } from "../theme";

const Loading = ({ size }: { size?: string }) => {
  const theme = useTheme();

  return (
    <Box flex={1} justifyContent="center" alignItems="center">
      <ActivityIndicator size={size} />
    </Box>
  );
};

export { Loading };
