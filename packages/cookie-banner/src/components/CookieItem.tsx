import React from "react";
import { Typography } from "@rbx/ui";

const CookieItem = ({
  cookieName,
  description,
}: {
  cookieName: string;
  description: string;
}) => {
  return (
    <div>
      <Typography variant="codeDense">{cookieName}</Typography>
      <Typography variant="body2" paragraph color="secondary">
        {description}
      </Typography>
    </div>
  );
};

export default CookieItem;
