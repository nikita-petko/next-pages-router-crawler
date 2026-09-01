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
import type { FormattedText } from '@modules/analytics-translations/types';

const FirstActionAutofocusPriority = '10';

export type TriggerSheetAction = {
  readonly label: FormattedText;
  readonly variant: ComponentProps<typeof Button>['variant'];
  /**
   * Called when the footer button is clicked. The sheet then closes unless
   * `closesSheet` is false.
   */
  readonly onClick?: () => void;
  readonly closesSheet?: boolean;
};

export type TriggerSheetProps = {
  readonly buttonLabel: FormattedText;
  readonly closeLabel: FormattedText;
  readonly title: FormattedText;
  readonly isLoading?: boolean;
  readonly actions?: readonly TriggerSheetAction[];
  readonly buttonIcon?: ComponentProps<typeof Button>['icon'];
  readonly onOpenChange?: (open: boolean) => void;
  readonly children: ReactNode;
};

const TriggerSheet: FC<TriggerSheetProps> = ({
  buttonLabel,
  closeLabel,
  title,
  isLoading = false,
  actions,
  buttonIcon,
  onOpenChange,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const hasActions = actions !== undefined && actions.length > 0;

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [onOpenChange],
  );

  const handleActionClick = useCallback(
    (onClick?: () => void, closesSheet = true) => {
      onClick?.();
      if (closesSheet) {
        handleOpenChange(false);
      }
    },
    [handleOpenChange],
  );

  return (
    <SheetRoot open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger>
        <Button
          variant='Standard'
          size='Medium'
          isDisabled={isLoading}
          isLoading={isLoading}
          icon={buttonIcon}>
          {buttonLabel}
        </Button>
      </SheetTrigger>
      <SheetContent largeScreenVariant='side' closeLabel={closeLabel}>
        <SheetTitle>{title}</SheetTitle>
        <SheetBody>{children}</SheetBody>
        {hasActions && (
          <SheetActions className='flex gap-x-small'>
            {actions.map(({ label, variant, onClick, closesSheet }, index) => (
              <Button
                key={label}
                className='grow-1 basis-0'
                variant={variant}
                size='Medium'
                onClick={() => handleActionClick(onClick, closesSheet)}
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

export default TriggerSheet;
