import React from "react";
import { Link, Typography } from "@rbx/ui";
import { useTranslation } from "@rbx/intl";
import TranslationKeys from "../localization/enums/TranslationKeys";
import { GA_READ_MORE_URL, GA_READ_MORE_URL_PLACEHOLDER } from "../constants";

const GAReadMoreLink = () => {
  const { translate } = useTranslation();
  const text = translate(TranslationKeys.GAReadMore);

  if (!text.includes(GA_READ_MORE_URL_PLACEHOLDER)) {
    return <React.Fragment>{text}</React.Fragment>;
  }

  const [before, after] = text.split(GA_READ_MORE_URL_PLACEHOLDER);

  return (
    <Typography variant="body2">
      {before}
      <Link
        href={GA_READ_MORE_URL}
        target="_blank"
        underline="hover"
        color="inherit"
      >
        {translate(TranslationKeys.GoogleAnalytics)}
      </Link>
      {after}
    </Typography>
  );
};

export default GAReadMoreLink;
