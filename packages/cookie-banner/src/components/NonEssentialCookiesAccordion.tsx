import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  Typography,
} from "@rbx/ui";

import React from "react";
import { useTranslation } from "@rbx/intl";
import {
  GA_COMPANY_COLLECTION_LIST,
  GOOGLE_ANALYTICS_URL,
  GOOGLE_INC,
} from "../constants";
import useCookiesAccordionStyles from "./CookiesAccordion.styles";
import TranslationKeys from "../localization/enums/TranslationKeys";
import CookieItem from "./CookieItem";
import { NonEssentialCookieName } from "../types";
import ServiceLink from "./ServiceLink";
import ContentItem from "./ContentItem";
import GAReadMoreLink from "./GAReadMoreLink";

const NonEssentialCookiesAccordion = ({
  isAnalyticsCookieAccepted,
  setIsAnalyticsCookieAccepted,
}: {
  isAnalyticsCookieAccepted: boolean;
  setIsAnalyticsCookieAccepted: (isAnalyticsCookieAccepted: boolean) => void;
}) => {
  const { classes } = useCookiesAccordionStyles();
  const { translate } = useTranslation();
  return (
    <Accordion className={classes.accordion}>
      <AccordionSummary className={classes.accordionSummary}>
        <Typography variant="h6">
          {translate(TranslationKeys.AnalyticsCookie)}
        </Typography>
        <Switch
          checked={isAnalyticsCookieAccepted}
          onChange={(_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
            setIsAnalyticsCookieAccepted(checked);
          }}
          aria-label={translate(TranslationKeys.AnalyticsCookie)}
          size="small"
        />
      </AccordionSummary>
      <AccordionDetails>
        <CookieItem
          key={NonEssentialCookieName.RBXViralAcquisition}
          cookieName={NonEssentialCookieName.RBXViralAcquisition}
          description={translate(
            TranslationKeys.RBXViralAcquisitionDescription
          )}
        />
        <CookieItem
          key={NonEssentialCookieName.RBXSource}
          cookieName={NonEssentialCookieName.RBXSource}
          description={translate(TranslationKeys.RBXSourceDescription)}
        />
        <ServiceLink
          href={GOOGLE_ANALYTICS_URL}
          text={translate(TranslationKeys.GoogleAnalytics)}
        />
        <Typography variant="body2" paragraph>
          {translate(TranslationKeys.OwnedBy)}
          &nbsp;
          {GOOGLE_INC}
        </Typography>
        <ContentItem
          title={translate(TranslationKeys.GoogleAnalyticsPurposeHeader)}
          content={translate(TranslationKeys.GoogleAnalyticsPurposeDescription)}
        />
        <Typography variant="body2">
          {translate(TranslationKeys.CompanyCollectionHeader)}
        </Typography>
        {GA_COMPANY_COLLECTION_LIST.map((item) => (
          <ContentItem
            key={item.label}
            title={translate(item.label)}
            content={translate(item.content)}
            secondary
          />
        ))}
        <GAReadMoreLink />
      </AccordionDetails>
    </Accordion>
  );
};
export default NonEssentialCookiesAccordion;
