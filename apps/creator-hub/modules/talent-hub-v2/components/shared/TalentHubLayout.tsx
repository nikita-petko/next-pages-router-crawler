import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { TProductKey } from '@rbx/creator-hub-navigation';
import { Button, Icon } from '@rbx/foundation-ui';
import { LocalizationProvider, withTranslation } from '@rbx/intl';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import {
  TranslationNamespace,
  TranslationResourceProvider,
  defaultLocale,
  defaultNativeName,
  fallbackLocale,
} from '@modules/miscellaneous/localization';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { logInteractionClick } from '../../analytics';
import { ViewModeProvider } from '../../contexts/ViewModeContext';
import { useIsM2Enabled } from '../../hooks/useIsM2Enabled';
import { useIsV2Enabled } from '../../hooks/useIsV2Enabled';
import { useIsInStudioContext, useMyStudios } from '../../hooks/useMyStudios';
import { TalentHubBreadcrumbs } from './TalentHubBreadcrumbs';
import type { Crumb } from './TalentHubBreadcrumbs';
import { TalentHubSideNav } from './TalentHubSideNav';
import styles from './Layout.module.css';

const TranslationScope: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
const TranslatedScope = withTranslation(TranslationScope, [TranslationNamespace.TalentHubV2]);
const th2TranslationResourceProvider = new TranslationResourceProvider(
  { locale: defaultLocale, nativeName: defaultNativeName },
  fallbackLocale,
);

type TalentHubLayoutProps = {
  crumbs: Crumb[];
  children: React.ReactNode;
};

/**
 * The app shell grid (@rbx/creator-hub-navigation `CreatorHubLayout`) renders
 * `MuiGrid` containers with `width: 100vw`, which includes the scrollbar gutter
 * and causes horizontal overflow. This injects a scoped stylesheet (removed on
 * unmount) that constrains the page and grid to the visible viewport. The
 * `<style>` tag is appended last in `<head>`, so equal-specificity rules win by
 * source order. Where the shell uses higher specificity, we boost ours with
 * repeated class selectors or element-qualified selectors.
 *
 * TODO: Remove once the shell adopts a layout that respects `100%` instead of `100vw`.
 */
const SHELL_GRID_FIX_CSS = [
  'html, body, #__next { overflow-x: hidden; max-width: 100vw; }',
  '.MuiGrid-root.MuiGrid-root { min-width: 0; }',
  'html .MuiGrid-root:not(.MuiGrid-root .MuiGrid-root) {',
  '  width: 100%;',
  '  max-width: 100vw;',
  '}',
].join('\n');

function useFixShellGridWidth() {
  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-th2-grid-fix', '');
    style.textContent = SHELL_GRID_FIX_CSS;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);
}

const INTERACTION_SELECTOR = [
  'button',
  'a',
  '[role="button"]',
  '[role="menuitem"]',
  '[role="tab"]',
  'input[type="button"]',
  'input[type="submit"]',
  'input[type="radio"]',
  'input[type="checkbox"]',
].join(',');

function toInteractionAction(element: Element): string {
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel?.trim()) {
    return ariaLabel.trim();
  }

  const testId = element.getAttribute('data-testid');
  if (testId?.trim()) {
    return testId.trim();
  }

  const text = element.textContent?.replaceAll(/\s+/g, ' ').trim();
  if (text) {
    return text.slice(0, 80);
  }

  return element.tagName.toLowerCase();
}

const STUDIO_ONBOARDING_BANNER_DISMISSED_PREFIX = 'th2-studio-onboarding-banner-dismissed';

const StudioOnboardingBanner: React.FC = () => {
  const router = useRouter();
  const currentGroup = useCurrentGroup();
  const { isInStudioContext } = useIsInStudioContext();
  const { data: myStudiosData, isFetching } = useMyStudios();
  const [dismissed, setDismissed] = useState(true);
  const currentPath = (router.asPath || router.pathname).split('?')[0]?.replace(/\/$/, '');
  // Hide the banner anywhere inside the studio-apply funnel — the employer
  // profile entry page (`/hire/my-studio`) and the onboarding criteria + form
  // pages (`/hire/my-studio/onboard`, `/hire/my-studio/onboard/form`). The
  // banner's only job is to nudge users INTO this flow; once they are in it,
  // it is redundant.
  const isInStudioApplyFlow =
    currentPath === '/hire/my-studio' ||
    (currentPath?.startsWith('/hire/my-studio/onboard') ?? false);
  const storageKey = useMemo(
    () => `${STUDIO_ONBOARDING_BANNER_DISMISSED_PREFIX}:${currentGroup?.id ?? 'none'}`,
    [currentGroup?.id],
  );

  useEffect(() => {
    setDismissed(window.localStorage.getItem(storageKey) === 'true');
  }, [storageKey]);

  const handleApplyNavigate = useCallback(() => {
    void router.push('/hire/my-studio/onboard');
  }, [router]);

  const hasOnboardedStudio = Boolean(myStudiosData?.studios?.[0]?.id);
  const shouldShow =
    isInStudioContext &&
    !isInStudioApplyFlow &&
    !dismissed &&
    !isFetching &&
    myStudiosData !== undefined &&
    !hasOnboardedStudio;

  if (!shouldShow) {
    return null;
  }

  const handleDismiss = () => {
    // TODO: Move dismissal to a backend user preference once that surface exists.
    window.localStorage.setItem(storageKey, 'true');
    setDismissed(true);
  };

  return (
    <output className={styles.studioOnboardingBanner}>
      <div className='items-center min-width-0 gap-small flex'>
        <Icon name='icon-regular-circle-i' size='Small' />
        <span className='text-body-small'>
          {/* oxlint-disable-next-line rbx/no-hardcoded-translation-string - outof scope for this PR. @cmurphy to fix  */}
          Looking to hire? Apply to start posting jobs and connect with top talent.
        </span>
      </div>
      <div className='items-center gap-xsmall flex'>
        <Button variant='Standard' size='Small' onClick={handleApplyNavigate}>
          {/* oxlint-disable-next-line rbx/no-hardcoded-translation-string - outof scope for this PR. @cmurphy to fix  */}
          Apply
        </Button>
        <Button
          variant='Utility'
          size='Small'
          onClick={handleDismiss}
          aria-label='Dismiss studio onboarding banner'>
          <Icon name='icon-regular-x' size='Small' />
        </Button>
      </div>
    </output>
  );
};

export const TalentHubLayout: React.FC<TalentHubLayoutProps> = ({ crumbs, children }) => {
  useFixShellGridWidth();
  const router = useRouter();
  const { v2Enabled, isFetched: isV2Fetched } = useIsV2Enabled();
  const { m2Enabled, isFetched: isM2Fetched } = useIsM2Enabled();
  const isFetched = isV2Fetched && isM2Fetched;
  // Show TH2 chrome (sidenav, breadcrumbs, product header) for anyone enrolled
  // in either flag. Most users post-GA have M2 only; V2 is reserved for the
  // experimental onboarding round. Either is sufficient to expose the surface.
  const showTalentChrome = v2Enabled || m2Enabled;
  const handleClickCapture = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target instanceof Element ? event.target : null;
    const interactable = target?.closest(INTERACTION_SELECTOR);
    if (!interactable) {
      return;
    }

    logInteractionClick({
      action: toInteractionAction(interactable),
      elementType: interactable.getAttribute('role') ?? interactable.tagName.toLowerCase(),
      route: router.pathname,
      testId: interactable.getAttribute('data-testid') ?? undefined,
    });
  };

  // While enrollment is loading, render nothing. The Talent sidenav / product
  // chrome must not flash for un-enrolled users, because its presence leaks that
  // the feature exists to anyone who lands on /hire without being in the experiment.
  if (!isFetched) {
    return <CreatorHubLayout disableLeftNavigation />;
  }

  // Denied: use the canonical neutral 404 chrome (disableLeftNavigation matches
  // pages/404.tsx) so the page looks identical to any other not-found route.
  // The page components themselves (via TalentHubV2Guard / TalentHubM2Guard)
  // still render <PageNotFound />.
  if (!showTalentChrome) {
    return <CreatorHubLayout disableLeftNavigation>{children}</CreatorHubLayout>;
  }

  const product: TProductKey = 'Talent';
  return (
    <ViewModeProvider>
      <LocalizationProvider provider={th2TranslationResourceProvider}>
        <TranslatedScope>
          <div onClickCapture={handleClickCapture}>
            <CreatorHubLayout
              product={product}
              title={<TalentHubBreadcrumbs crumbs={crumbs} />}
              noBreadCrumbs
              secondarySize='small'
              secondaryRail={<TalentHubSideNav />}>
              <StudioOnboardingBanner />
              {children}
            </CreatorHubLayout>
          </div>
        </TranslatedScope>
      </LocalizationProvider>
    </ViewModeProvider>
  );
};

export default withTranslation(TalentHubLayout, [TranslationNamespace.TalentHubV2]);
