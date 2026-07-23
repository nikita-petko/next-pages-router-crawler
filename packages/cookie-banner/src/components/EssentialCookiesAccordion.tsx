import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@rbx/ui";
import { useTranslation } from "@rbx/intl";
import { useCookieConsentContext } from "../contexts/CookieConsentContext";
import TranslationKeys from "../localization/enums/TranslationKeys";
import CookieItem from "./CookieItem";
import useCookiesAccordionStyles from "./CookiesAccordion.styles";

const EssentialCookiesAccordion = () => {
  const { translate } = useTranslation();
  const { cookiePolicy } = useCookieConsentContext();
  const { classes } = useCookiesAccordionStyles();

  if (!cookiePolicy || !cookiePolicy.EssentialCookieList?.length) {
    return null;
  }

  return (
    <Accordion className={classes.accordion}>
      <AccordionSummary className={classes.accordionSummary}>
        <Typography variant="h6">
          {translate(TranslationKeys.EssentialCookie)}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {cookiePolicy.EssentialCookieList.map((cookie) => (
          <CookieItem
            key={cookie.cookieName}
            cookieName={cookie.cookieName}
            description={translate(cookie.description)}
          />
        ))}
      </AccordionDetails>
    </Accordion>
  );
};

export default EssentialCookiesAccordion;
