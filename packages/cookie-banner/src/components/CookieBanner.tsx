import React, { useMemo } from "react";
import { useTranslation } from "@rbx/intl";
import {
  Drawer,
  Button,
  makeStyles,
  Link,
  Typography,
  useTheme,
  useMediaQuery,
  Grid,
} from "@rbx/ui";
import TranslationKeys from "../localization/enums/TranslationKeys";
import {
  PRIVACY_POLICY_URL,
  PRIVACY_POLICY_URL_PLACEHOLDER,
} from "../constants";

const useStyles = makeStyles()((theme) => ({
  root: {
    padding: 24,
    maxWidth: 1250,
    margin: "0 auto",
  },
  content: {
    marginBottom: 16,
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    [theme.breakpoints.down("Medium")]: {
      flexDirection: "column",
      alignItems: "flex-start",
    },
  },
  buttons: {
    display: "flex",
    gap: 12,
    [theme.breakpoints.down("Medium")]: {
      flexDirection: "column",
      width: "100%",
    },
  },
  backdrop: {
    backgroundColor: "transparent",
  },
}));

interface CookieBannerProps {
  onAcceptAll: () => void;
  onDeclineAll: () => void;
  onLearnMore: () => void;
  isOpen: boolean;
}

const CookieBanner: React.FC<CookieBannerProps> = ({
  onAcceptAll,
  onDeclineAll,
  onLearnMore,
  isOpen,
}) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("Medium"));

  const privacyPolicyLink = useMemo(
    () => (
      <Link
        href={PRIVACY_POLICY_URL}
        target="_blank"
        underline="hover"
        color="inherit"
      >
        {translate(TranslationKeys.PrivacyPolicy)}
      </Link>
    ),
    [translate]
  );

  const translatedContent = useMemo(() => {
    // Reuse existing translation and not have to create new ones,
    // existing string uses {privacyPolicyLink} placeholder instead of open/end tags
    const text = translate(TranslationKeys.CookieBannerContent);
    if (!text.includes(PRIVACY_POLICY_URL_PLACEHOLDER)) {
      return text;
    }
    const parts = text.split(PRIVACY_POLICY_URL_PLACEHOLDER);
    return (
      <React.Fragment>
        {parts[0]}
        {privacyPolicyLink}
        {parts[1] || ""}
      </React.Fragment>
    );
  }, [translate, privacyPolicyLink]);

  return (
    <Drawer
      open={isOpen}
      onClose={onDeclineAll} // dismiss banner is considered a decline
      anchor="bottom"
      variant="temporary"
      ModalProps={{
        BackdropProps: {
          classes: { root: classes.backdrop },
        },
      }}
    >
      <Grid className={classes.root}>
        <Grid className={classes.content}>
          <Typography variant="body2">{translatedContent}</Typography>
        </Grid>
        <Grid className={classes.actions}>
          <Button variant="text" onClick={onLearnMore} color="secondary">
            {translate(TranslationKeys.SetCookieOptions)}
          </Button>
          <Grid className={classes.buttons}>
            <Button
              color="secondary"
              variant="outlined"
              onClick={onDeclineAll}
              fullWidth={isMobile}
            >
              {translate(TranslationKeys.DeclineAll)}
            </Button>
            <Button
              color="secondary"
              variant="contained"
              onClick={onAcceptAll}
              fullWidth={isMobile}
            >
              {translate(TranslationKeys.AcceptAll)}
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Drawer>
  );
};

export default CookieBanner;
