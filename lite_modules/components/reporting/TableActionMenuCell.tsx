import {
  IconButton,
  Menu,
  MenuItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
  TableCell,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import { AxiosError } from 'axios';
import { useRouter } from 'next/router';
import { ReactElement, ReactNode, useState } from 'react';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import { openErrorDialog } from '@components/common/dialog/errorDialog';
import { openImpersonationErrorDialog } from '@components/common/dialog/impersonationErrorDialog';
import {
  closeCancelCampaignDialog,
  openCancelCampaignDialog,
} from '@components/reporting/dialogs/CancelCampaignDialog';
import useTableActionMenuCellStyles from '@components/reporting/TableActionMenuCell.styles';
import { EntityType } from '@constants/entity';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useAppStore } from '@stores/appStoreProvider';
import { NewFlowStoreType, useNewFlowStore } from '@stores/newFlowStoreProvider';
import { ToastStoreType, useToastStore } from '@stores/toastStoreProvider';
import { AMAErrorResponseType } from '@type/errorResponse';
import { ConvertEntityTypeEnumToString } from '@utils/enumToString';
import { IsImpersonationError } from '@utils/error';
import { SessionStorageKeys, SetSessionStorage } from '@utils/sessionStorage';
import { GetUrlWithParams } from '@utils/url';

const TableActionMenuCell = ({
  cancelDisabledTooltip,
  className,
  editDisabledTooltip,
  entityId,
  menuButtonClassName,
}: {
  cancelDisabledTooltip?: string;
  className: string;
  editDisabledTooltip?: string;
  entityId: string;
  menuButtonClassName: string;
}) => {
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { advertisingShouldBeEnabled, disabledTooltip } = useAppStore((state) =>
    state.advertisingShouldBeEnabled(),
  );
  const [open, setOpen] = useState<boolean>(false);
  const router = useRouter();
  const handleClose = () => {
    setOpen(false);
  };

  const cancelCampaign = useNewFlowStore((state: NewFlowStoreType) => state.cancelCampaign);
  const { setShowCancelSuccessful } = useToastStore((state: ToastStoreType) => state);

  // Returns the promise so CancelCampaignDialog can await it and drive the
  // confirm button's loading state. CancelCampaignDialog auto-closes itself
  // on resolve, so the success branch needs no explicit close. The error
  // branch closes the cancel dialog before opening the error / impersonation
  // dialog so the two layers don't stack — both error and impersonation
  // dialogs share the same DialogOutlet slot, but the explicit close keeps
  // the visible flow predictable. We use the identity-checked
  // `closeCancelCampaignDialog` so a session-expired-style interrupt that
  // replaced the cancel dialog mid-await won't get dismissed here.
  const cancelCampaignRow = (): Promise<void> => {
    logNativeClickEvent(EventName.CancelCampaign);
    return cancelCampaign(entityId)
      .then(() => {
        setShowCancelSuccessful(true);
      })
      .catch((error) => {
        closeCancelCampaignDialog();
        if (IsImpersonationError(error)) {
          openImpersonationErrorDialog();
        } else {
          openErrorDialog((error as AxiosError<AMAErrorResponseType>)?.response?.data);
        }
      });
  };

  const {
    classes: { openMoreOptionsIconButton },
    cx,
  } = useTableActionMenuCellStyles();

  // A disabled MenuItem has `pointer-events-none`, so the tooltip trigger must
  // wrap the item in a hoverable element to still surface the disabled reason.
  const withDisabledTooltip = (item: ReactElement, tooltipText?: string): ReactNode =>
    tooltipText ? (
      <Tooltip delayDurationMs={0} position='right-center' title={tooltipText}>
        <TooltipTrigger asChild>
          <span className='block width-full'>{item}</span>
        </TooltipTrigger>
      </Tooltip>
    ) : (
      item
    );

  const duplicateDisabledTooltip =
    !advertisingShouldBeEnabled && disabledTooltip ? translateReport(disabledTooltip) : undefined;

  return (
    <TableCell align='start' className={className}>
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild>
          <IconButton
            // Keeps the button visible while the menu is open and row hover can't be detected.
            ariaLabel={translateReport('Description.MoreOptions')}
            className={cx(menuButtonClassName, { [openMoreOptionsIconButton]: open })}
            icon='icon-regular-three-dots-vertical'
            isCircular
            size='Medium'
            variant='Utility'
          />
        </PopoverTrigger>
        <PopoverContent
          align='start'
          ariaLabel={translateReport('Description.MoreOptions')}
          side='bottom'>
          <Menu>
            {withDisabledTooltip(
              <MenuItem
                disabled={editDisabledTooltip !== undefined}
                onSelect={() => {
                  logNativeClickEvent(EventName.EditButtonClicked, {
                    entityType: ConvertEntityTypeEnumToString(EntityType.ENTITY_TYPE_CAMPAIGN),
                  });
                  SetSessionStorage(SessionStorageKeys.PREVIOUS_PAGE, Routes.MANAGE);
                  handleClose();
                  router.push(GetUrlWithParams(Routes.EDIT_CAMPAIGN, { campaignId: entityId }));
                }}
                title={translateMisc('Action.Edit')}
                value='edit'
              />,
              editDisabledTooltip,
            )}
            {withDisabledTooltip(
              <MenuItem
                disabled={!advertisingShouldBeEnabled}
                onSelect={() => {
                  logNativeClickEvent(EventName.CloneCampaign);
                  handleClose();
                  router.push(
                    GetUrlWithParams(Routes.NEW_CREATE_CAMPAIGN, { campaignId: entityId }),
                  );
                }}
                title={translateReport('Action.Duplicate')}
                value='duplicate'
              />,
              duplicateDisabledTooltip,
            )}
            {withDisabledTooltip(
              <MenuItem
                disabled={cancelDisabledTooltip !== undefined}
                onSelect={() => {
                  openCancelCampaignDialog(cancelCampaignRow);
                  handleClose();
                }}
                title={translateMisc('Action.Cancel')}
                value='cancel'
              />,
              cancelDisabledTooltip,
            )}
          </Menu>
        </PopoverContent>
      </Popover>
    </TableCell>
  );
};

export default TableActionMenuCell;
