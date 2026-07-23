import React from "react";
import { useTranslation } from "@rbx/intl";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  makeStyles,
  accordionSummaryClasses,
  dialogContentClasses,
} from "@rbx/ui";
import TranslationKeys from "../localization/enums/TranslationKeys";
import { PRIVACY_POLICY_URL, REQUEST_DATA_URL } from "../constants";
import ServiceLink from "./ServiceLink";
import { useCookieConsentContext } from "../contexts/CookieConsentContext";
import EssentialCookiesAccordion from "./EssentialCookiesAccordion";
import NonEssentialCookiesAccordion from "./NonEssentialCookiesAccordion";

export interface CookieConsentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  isAnalyticsCookieAccepted: boolean;
  setIsAnalyticsCookieAccepted: (isAnalyticsCookieAccepted: boolean) => void;
}

const useStyles = makeStyles()((theme) => ({
  accordionSummary: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    [`& .${accordionSummaryClasses.content}`]: {
      margin: 0,
      "&.Mui-expanded": {
        margin: 0,
      },
    },
    "&.Mui-expanded": {
      minHeight: "48px",
    },
  },
  accordion: {
    "&::before": {
      height: 0,
    },
    "&.Mui-expanded": {
      margin: 0,
    },
  },
  paragraph: {
    marginBottom: "12px",
  },
  dialogContent: {
    [`&.${dialogContentClasses.root}`]: {
      paddingTop: "12px",
    },
    scrollbarColor: "grey transparent",
    scrollbarWidth: "thin",
    "&::-webkit-scrollbar": {
      width: 6,
    },
    "&::-webkit-scrollbar-thumb": {
      background: "grey",
      borderRadius: "10rem",
    },
    "&::-webkit-scrollbar-track": {
      background: "transparent",
    },
  },
  accordionSection: {
    marginTop: "12px",
  },
  accordionContainer: {
    border: `1px solid ${theme.palette.components.divider}`,
    "&:first-of-type": {
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
    },
    "&:last-of-type": {
      borderTop: "none",
      borderBottomLeftRadius: "12px",
      borderBottomRightRadius: "12px",
    },
    // Handle case when there's only one accordion container
    "&:first-of-type:last-of-type": {
      borderTop: `1px solid ${theme.palette.components.divider}`,
    },
  },
}));

const CookieConsentModal: React.FC<CookieConsentModalProps> = ({
  open,
  onClose,
  onSave,
  isAnalyticsCookieAccepted,
  setIsAnalyticsCookieAccepted,
}) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const { cookiePolicy } = useCookieConsentContext();

  if (!cookiePolicy) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {translate(TranslationKeys.ConsentToolModalTitle)}
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>
        <Typography variant="h6">
          {translate(TranslationKeys.InfoCollectionHeader)}
        </Typography>
        <Typography
          variant="body2"
          paragraph
          className={classes.paragraph}
          color="secondary"
        >
          {translate(TranslationKeys.InfoCollectionContent)}
        </Typography>
        <Typography variant="h6">
          {translate(TranslationKeys.InfoCollectionHeader2)}
        </Typography>
        <Typography
          variant="body2"
          paragraph
          className={classes.paragraph}
          color="secondary"
        >
          {translate(TranslationKeys.InfoCollectionContent2)}
        </Typography>
        <Typography variant="h6">
          {translate(TranslationKeys.InfoPartnerCollectionHeader)}
        </Typography>
        <Typography
          variant="body2"
          paragraph
          className={classes.paragraph}
          color="secondary"
        >
          {translate(TranslationKeys.InfoPartnerCollectionContent)}
        </Typography>
        <ServiceLink
          href={REQUEST_DATA_URL}
          text={translate(TranslationKeys.RequestData)}
        />
        <ServiceLink
          href={PRIVACY_POLICY_URL}
          text={translate(TranslationKeys.PrivacyPolicy)}
        />
        <div className={classes.accordionSection}>
          {cookiePolicy.EssentialCookieList?.length > 0 && (
            <div className={classes.accordionContainer}>
              <EssentialCookiesAccordion />
            </div>
          )}
          <div className={classes.accordionContainer}>
            <NonEssentialCookiesAccordion
              isAnalyticsCookieAccepted={isAnalyticsCookieAccepted}
              setIsAnalyticsCookieAccepted={setIsAnalyticsCookieAccepted}
            />
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button color="secondary" variant="outlined" onClick={onClose}>
          {translate(TranslationKeys.CancelBtn)}
        </Button>
        <Button color="primaryBrand" variant="contained" onClick={onSave}>
          {translate(TranslationKeys.SaveBtn)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CookieConsentModal;
