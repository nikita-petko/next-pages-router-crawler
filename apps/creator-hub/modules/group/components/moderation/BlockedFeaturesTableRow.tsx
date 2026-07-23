import { useMemo } from 'react';
import { Toggle, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useTranslation, useLocalization, Locale } from '@rbx/intl';
import type { GroupFeatureResponseItem } from '@modules/clients/groups';

export type BlockedFeaturesTableRowProps = {
  feature: GroupFeatureResponseItem;
  isGroupLocked: boolean | undefined;
  onRequestUnblock: (feature: GroupFeatureResponseItem) => void;
};

const BlockedFeaturesTableRow = ({
  feature,
  isGroupLocked,
  onRequestUnblock,
}: BlockedFeaturesTableRowProps) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();

  const isBlockedByRoblox = isGroupLocked || feature.expiration !== undefined;
  const isBlocked = isGroupLocked || feature.isFeatureBlocked;

  const dateFormatter = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale ?? Locale.English, {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    return formatter.format;
  }, [locale]);

  let statusLabel: string;
  if (isBlockedByRoblox) {
    statusLabel = translate('Label.BlockedByRoblox');
  } else if (isBlocked) {
    statusLabel = translate('Label.Blocked');
  } else {
    statusLabel = translate('Label.NotBlocked');
  }

  const toggle = (
    <Toggle
      label={statusLabel}
      placement='Start'
      size='Medium'
      aria-label={`${feature.feature} - ${statusLabel}`}
      isChecked={isBlocked ?? false}
      onCheckedChange={() => !isBlockedByRoblox && onRequestUnblock(feature)}
      isDisabled={isBlockedByRoblox || !isBlocked}
    />
  );

  return (
    <tr style={{ borderTop: '1px solid var(--color-stroke-default)' }}>
      <td className='padding-xlarge'>
        <span className='text-body-medium content-default'>
          {translate(`Label.${feature.feature}`)}
        </span>
      </td>
      <td className='padding-xlarge'>
        {isBlockedByRoblox ? (
          <Tooltip
            title=''
            description={
              isGroupLocked
                ? translate('Message.BlockedByGroupLock')
                : translate('Message.BlockedByRoblox', {
                    date: dateFormatter(feature.expiration),
                  })
            }
            position='right-start'>
            <TooltipTrigger asChild>
              <span className='flex items-center gap-xsmall'>{toggle}</span>
            </TooltipTrigger>
          </Tooltip>
        ) : (
          toggle
        )}
      </td>
    </tr>
  );
};

export default BlockedFeaturesTableRow;
