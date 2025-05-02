import React from "react";

import { Text } from "../../theme/app-theme";

interface HeaderTitleDescProps {
  title: string;
  description: string;
}

const HeaderTitleDesc = ({ title, description }: HeaderTitleDescProps) => {
  return (
    <>
      <Text fontWeight={"500"} color="black" variant={"h2"}>
        {title}
      </Text>

      <Text paddingVertical={"s"} color={"black"} fontWeight={"500"} variant={"h6"}>
        {description}
      </Text>
    </>
  );
};

export default HeaderTitleDesc;
