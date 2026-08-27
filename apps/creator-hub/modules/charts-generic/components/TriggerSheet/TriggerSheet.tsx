import type { ComponentProps, FC, ReactNode } from 'react';
import { useCallback, useState } from 'react';
import {
  Button,
  SheetActions,
  SheetBody,
  SheetContent,
  SheetRoot,
  SheetTitle,
  SheetTrigger,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import type { FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const FirstActionAutofocusPriority = '10';

export type TriggerSheetAction = {
  readonly label: FormattedText;
  readonly variant: ComponentProps<typeof Button>['variant'];
  /**
   * Called when the footer button is clicked, then the sheet closes.
   * Omit to close the sheet with no extra side effect.
   */
  readonly onClick?: () => void;
};

export type TriggerSheetProps = {
  readonly buttonLabel: FormattedText;
  readonly title: FormattedText;
  readonly isLoading?: boolean;
  readonly actions?: readonly TriggerSheetAction[];
  readonly children: ReactNode;
};

const TriggerSheet: FC<TriggerSheetProps> = ({
  buttonLabel,
  title,
  isLoading = false,
  actions,
  children,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const [open, setOpen] = useState(false);
  const closeLabel = translate(translationKey('Action.Close', TranslationNamespace.Controls));
  const hasActions = actions !== undefined && actions.length > 0;

  const handleActionClick = useCallback((onClick?: () => void) => {
    onClick?.();
    setOpen(false);
  }, []);

  return (
    <SheetRoot open={open} onOpenChange={setOpen}>
      <SheetTrigger>
        <Button variant='Standard' size='Medium' isDisabled={isLoading} isLoading={isLoading}>
          {buttonLabel}
        </Button>
      </SheetTrigger>
      <SheetContent largeScreenVariant='side' closeLabel={closeLabel}>
        <SheetTitle>{title}</SheetTitle>
        <SheetBody>{children}</SheetBody>
        {hasActions && (
          <SheetActions className='flex gap-x-small'>
            {actions.map(({ label, variant, onClick }, index) => (
              <Button
                key={label}
                className='grow-1 basis-0'
                variant={variant}
                size='Medium'
                onClick={() => handleActionClick(onClick)}
                data-autofocus-priority={index === 0 ? FirstActionAutofocusPriority : undefined}>
                {label}
              </Button>
            ))}
          </SheetActions>
        )}
      </SheetContent>
    </SheetRoot>
  );
};

export default withNamespaceSwitchedTranslation(TriggerSheet, [TranslationNamespace.Controls]);
