import { TableCell, Toggle, type TTableCellAlign } from '@rbx/foundation-ui';
import { Tooltip } from '@rbx/ui';
import { AxiosError } from 'axios';
import { ReactNode } from 'react';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import { openErrorDialog } from '@components/common/dialog/errorDialog';
import { openImpersonationErrorDialog } from '@components/common/dialog/impersonationErrorDialog';
import { ServerAdStatusType } from '@constants/ad';
import { ServerCampaignStatusType } from '@constants/campaign';
import { EntityType } from '@constants/entity';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { NewFlowStoreType, useNewFlowStore } from '@stores/newFlowStoreProvider';
import { AMAErrorResponseType } from '@type/errorResponse';
import { ConvertEntityTypeEnumToString } from '@utils/enumToString';
import { IsImpersonationError } from '@utils/error';

const TableToggleCell = ({
  align = 'center',
  className,
  entityId,
  entityOn = false,
  entityType,
  toggleDisabled = false,
  toggleDisabledTooltip = '',
}: {
  align: TTableCellAlign;
  className: string;
  entityId: string;
  entityOn: boolean;
  entityType: EntityType;
  toggleDisabled: boolean;
  toggleDisabledTooltip?: ReactNode;
}) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);

  const { toggleAd, toggleCampaign } = useNewFlowStore((state: NewFlowStoreType) => state);

  const toggleEntity = (): Promise<void> => {
    if (entityType === EntityType.ENTITY_TYPE_CAMPAIGN) {
      return toggleCampaign(
        entityId,
        entityOn ? ServerCampaignStatusType.STOPPED : ServerCampaignStatusType.ENABLED,
      );
    }
    if (entityType === EntityType.ENTITY_TYPE_AD) {
      return toggleAd(entityId, entityOn ? ServerAdStatusType.STOPPED : ServerAdStatusType.ENABLED);
    }
    return Promise.reject(new Error('Invalid EntityType'));
  };

  const onToggle = () => {
    toggleEntity().catch((error) => {
      if (IsImpersonationError(error)) {
        openImpersonationErrorDialog();
      } else {
        openErrorDialog((error as AxiosError<AMAErrorResponseType>)?.response?.data);
      }
    });
    logNativeClickEvent(EventName.ToggleEntity, {
      entityType: ConvertEntityTypeEnumToString(entityType),
      toggleStateBefore: entityOn.toString(),
    });
  };

  return (
    <TableCell align={align} className={className}>
      <Tooltip
        arrow
        placement='right'
        title={
          toggleDisabled && toggleDisabledTooltip ? (
            <div>
              <span>{toggleDisabledTooltip}</span>
            </div>
          ) : (
            ''
          )
        }>
        <span>
          <Toggle
            aria-label={translate('Description.ToggleEntity')}
            data-testid='toggle-entity'
            isChecked={entityOn}
            isDisabled={toggleDisabled}
            onCheckedChange={onToggle}
            placement='Start'
            size='Small'
          />
        </span>
      </Tooltip>
    </TableCell>
  );
};

export default TableToggleCell;
