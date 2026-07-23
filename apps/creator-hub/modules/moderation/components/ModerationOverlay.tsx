import { withTranslation } from '@rbx/intl';
import { NotApprovedUIProvider, NotApprovedPageContainer } from '@rbx/not-approved-page-ui';
import { useThemeMode } from '@rbx/settings';
import { UIThemeProvider } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useNotApprovedConfig from '../hooks/useNotApprovedConfig';

const MODERATED_STATUS = 'moderated';

/**
 * Split from the themed wrapper so `useNotApprovedConfig`'s `useTheme()` call resolves
 * against the overlay's own `UIThemeProvider` below (user's saved theme preference),
 * rather than against whatever local theme override the active page happens to install.
 */
const ModerationOverlayInner = () => {
  const config = useNotApprovedConfig();
  return (
    <NotApprovedUIProvider config={config}>
      <NotApprovedPageContainer />
    </NotApprovedUIProvider>
  );
};

/**
 * The overlay wraps itself in its own `UIThemeProvider` so the CssBaseline that provider
 * injects takes over body text/background styles from any nested page-level CssBaseline
 * (e.g. landing's forced `<UIThemeProvider theme="dark">`). Without this wrapper, plain
 * text inside the Foundation Dialog — which portals to `<body>` — would inherit the
 * page's overridden body color instead of the user's saved theme preference.
 */
const ModerationOverlayContent = withTranslation(() => {
  const { themeMode } = useThemeMode();
  return (
    <UIThemeProvider theme={themeMode}>
      <ModerationOverlayInner />
    </UIThemeProvider>
  );
}, [
  TranslationNamespace.NotApproved,
  TranslationNamespace.Moderation,
  TranslationNamespace.AppealsPortal,
  TranslationNamespace.CommonUIControls,
  TranslationNamespace.Error,
  TranslationNamespace.DashboardModeration,
]);

const ModerationOverlay = () => {
  const { status } = useAuthentication();
  return status === MODERATED_STATUS ? <ModerationOverlayContent /> : null;
};

export default ModerationOverlay;
