import type { LookDetailV2 } from '@rbx/client-look-api/v1';
import { CreatorType } from '@rbx/client-look-api/v1';
import { Icon, TextArea, TextInput } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { ReturnPolicy } from '@rbx/thumbnails';
import { Chip, Tooltip, useTheme } from '@rbx/ui';
import {
  Item,
  itemTypeToThumbnailType,
  itemTypeToReturnPolicyType,
} from '@modules/miscellaneous/common';
import Look from '@modules/miscellaneous/common/enums/Look';
import ItemThumbnail from '../../common/components/ItemThumbnail';
import LookUnavailableBanner from './LookUnavailableBanner';

interface LookItemDetailsProps {
  lookDetail: LookDetailV2;
  name: string;
  description: string;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
}

function LookItemDetails(props: LookItemDetailsProps) {
  const { translate } = useTranslation();
  const { lookDetail, name, description, setName, setDescription } = props;

  const { lookType, curator, lookId, creatingUniverseId } = lookDetail;
  const theme = useTheme();

  const isGroup = curator?.type === CreatorType.Group;
  const targetId = lookId ?? 0;
  // IEC looks are minted via an in-experience creation token; the look itself
  // is not independently saleable on the marketplace (the buying surface is
  // the in-experience flow), so we surface the same "Cannot be sold" notice
  // we show for IEC assets in `unifiedFeeSystem/components/ItemDetails.tsx`.
  const isIecLook = creatingUniverseId != null && creatingUniverseId > 0;

  const isDarkMode = theme.palette.mode === 'dark';
  const iconStem = lookType ? `${lookType.toLowerCase()}look` : 'makeuplook';
  const lookTypeChipLabelKey =
    lookType === Look.Avatar ? 'Label.AvatarLook' : lookType ? `Label.${lookType}` : 'Label.Makeup';
  const chipImage = isDarkMode
    ? `${process.env.assetPathPrefix}/unifiedFeeSystem/${iconStem}.svg`
    : `${process.env.assetPathPrefix}/unifiedFeeSystem/${iconStem}_black.svg`;
  const defaultImage = isDarkMode
    ? `${process.env.assetPathPrefix}/unifiedFeeSystem/makeuplook.svg`
    : `${process.env.assetPathPrefix}/unifiedFeeSystem/makeuplook_black.svg`;

  return (
    <div>
      <div className='flex wrap items-center justify-between gap-y-[16px] margin-bottom-[16px] large:grid large:gap-medium large:[grid-template-columns:3fr_8fr]'>
        <div className='text-display-small'>{translate('Label.ManageItem')}</div>
        <div className='flex items-center gap-small'>
          <Tooltip title={translate('Label.ItemTypeDescription')} placement='top'>
            <Chip
              icon={
                <img
                  src={chipImage}
                  alt='icon'
                  style={{ padding: '5px' }}
                  onError={(e) => {
                    if (e.target instanceof HTMLImageElement && e.target.src !== defaultImage) {
                      e.target.src = defaultImage;
                    }
                  }}
                />
              }
              variant='outlined'
              color='secondary'
              label={translate(lookTypeChipLabelKey)}
            />
          </Tooltip>
          {isIecLook && (
            <div className='flex items-center margin-left-auto'>
              <span className='text-body-medium content-muted'>
                {translate('Label.CannotBeSold')}
              </span>
              <Icon name='icon-regular-circle-i' size='Small' className='margin-left-[5px]' />
            </div>
          )}
        </div>
      </div>
      <LookUnavailableBanner
        items={lookDetail?.items ?? []}
        creatingUniverseId={lookDetail?.creatingUniverseId}
      />
      <div className='grid gap-medium margin-top-[16px] large:[grid-template-columns:3fr_8fr]'>
        <div>
          <div className='[max-width:248px] [max-height:248px]'>
            <ItemThumbnail
              containerClass='inline-block size-[250px] radius-medium max-[1343px]:size-[200px]'
              moderatedContainerClass='relative inline-block size-[200px] radius-medium'
              type={itemTypeToThumbnailType[Item.Look]}
              // TODO @asaxena UCP-1303
              // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- IDs are int64 and cannot be safely converted to JS number
              targetId={targetId as number}
              bundleModerationStatus={undefined}
              returnPolicy={
                isGroup ? ReturnPolicy.PlaceHolder : itemTypeToReturnPolicyType[Item.Look]
              }
              alt={name ?? ''}
              isPendingNewTarget={false}
              itemType={Item.Look}
            />
          </div>
        </div>
        <div className='flex flex-col gap-medium'>
          <TextInput
            id='name'
            label={translate('Label.ItemName')}
            isRequired
            maxLength={50}
            value={name}
            onChange={(event) => setName(event.target.value)}
            helperText={`${name.length}/50`}
            hasError={!name?.trim()}
          />
          <TextArea
            id='description'
            label={translate('Label.ItemDescription')}
            textareaClassName='[resize:none] [field-sizing:content]'
            maxLength={1000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            helperText={`${description.length}/1000`}
          />
        </div>
      </div>
    </div>
  );
}

export default LookItemDetails;
