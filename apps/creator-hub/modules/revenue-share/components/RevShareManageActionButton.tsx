import type { ComponentProps, FunctionComponent } from 'react';
import { Button, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type RevShareManageActionButtonProps = ComponentProps<typeof Button> & {
  canManage: boolean;
};

const RevShareManageActionButton: FunctionComponent<RevShareManageActionButtonProps> = ({
  canManage,
  isDisabled,
  children,
  ...buttonProps
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const managePermissionTooltip = tPendingTranslation(
    'You do not have permission to manage group revenue.',
    'Tooltip on revenue-share write actions when the user lacks configure/manage group revenue permission.',
    translationKey(
      'Tooltip.NoManageRevenuePermission',
      TranslationNamespace.RevenueShareAgreements,
    ),
  );
  const button = (
    <Button {...buttonProps} isDisabled={!canManage || Boolean(isDisabled)}>
      {children}
    </Button>
  );
  if (canManage) {
    return button;
  }
  return (
    <Tooltip title={managePermissionTooltip} position='top-center'>
      <TooltipTrigger asChild>
        <span className='inline-flex'>{button}</span>
      </TooltipTrigger>
    </Tooltip>
  );
};

export default RevShareManageActionButton;
