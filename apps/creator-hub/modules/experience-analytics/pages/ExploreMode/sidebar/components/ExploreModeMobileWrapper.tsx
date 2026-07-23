import type { FC, PropsWithChildren } from 'react';
import { useCallback } from 'react';
import {
  Button,
  SheetActions,
  SheetBody,
  SheetContent,
  SheetRoot,
  SheetTitle,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { makeStyles } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const useStyles = makeStyles()(() => ({
  // Foundation's sheet caps width on portrait viewports; the explore-mode
  // configure sheet is always full-bleed on mobile so the sidebar's nested
  // controls (metric/source picker, chart-type selector, etc.) have room to
  // breathe.
  mobileSheet: {
    width: '100%',
    maxWidth: '100% !important',
  },
  doneButton: {
    width: '100%',
  },
}));

type ExploreModeMobileWrapperProps = PropsWithChildren<{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}>;

/**
 * Bottom-sheet wrapper for the Explore Mode configure sidebar on mobile
 * portrait viewports. Wraps the standard `<ChartConfiguratorSidebar variant='sheet'>`
 * in a Foundation `SheetRoot` with a title bar and a full-width `Done` action.
 *
 * The wrapper owns its own translations + styles so callers only pass
 * `isOpen` / `onOpenChange` and the sidebar children.
 */
const ExploreModeMobileWrapper: FC<ExploreModeMobileWrapperProps> = ({
  isOpen,
  onOpenChange,
  children,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const {
    classes: { mobileSheet, doneButton },
  } = useStyles();

  const titleLabel = tPendingTranslation(
    'Configure',
    'Title for the mobile chart configuration sheet.',
    translationKey('Heading.ExploreMode.ConfigureSheet', TranslationNamespace.Analytics),
  );
  const closeLabel = tPendingTranslation(
    'Close configuration',
    'Aria label for closing the chart configuration sheet.',
    translationKey('Action.ExploreMode.CloseConfiguration', TranslationNamespace.Analytics),
  );
  const doneLabel = tPendingTranslation(
    'Done',
    'Button label to close the chart configuration sheet on mobile.',
    translationKey('Action.ExploreMode.Done', TranslationNamespace.Analytics),
  );

  const handleDone = useCallback(() => onOpenChange(false), [onOpenChange]);

  return (
    <SheetRoot open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        largeScreenVariant='side'
        closeLabel={closeLabel}
        mobilePortraitClassName={mobileSheet}>
        <SheetTitle>{titleLabel}</SheetTitle>
        <SheetBody>{children}</SheetBody>
        <SheetActions>
          <Button variant='Emphasis' size='Medium' className={doneButton} onClick={handleDone}>
            {doneLabel}
          </Button>
        </SheetActions>
      </SheetContent>
    </SheetRoot>
  );
};

export default ExploreModeMobileWrapper;
