import type { LookDetailV2 } from '@rbx/client-look-api/v1';
import { CreatorType } from '@rbx/client-look-api/v1';
import { useTranslation } from '@rbx/intl';
import { ReturnPolicy } from '@rbx/thumbnails';
import {
  TextField,
  Typography,
  Grid,
  Chip,
  Tooltip,
  InfoOutlinedIcon,
  makeStyles,
  useTheme,
} from '@rbx/ui';
import {
  Item,
  itemTypeToThumbnailType,
  itemTypeToReturnPolicyType,
} from '@modules/miscellaneous/common';
import Look from '@modules/miscellaneous/common/enums/Look';
import ItemThumbnail from '../../common/components/ItemThumbnail';
import { useItemConfigureFormStyles } from '../../unifiedFeeSystem/helper/StyleHooks';
import LookUnavailableBanner from './LookUnavailableBanner';

interface LookItemDetailsProps {
  lookDetail: LookDetailV2;
  name: string;
  description: string;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
}

const useStyles = makeStyles()(() => ({
  thumbnail: {
    maxWidth: '248px',
    maxHeight: '248px',
    marginTop: '15px',
  },
  iecInfoIcon: {
    marginLeft: 5,
  },
}));

function LookItemDetails(props: LookItemDetailsProps) {
  const {
    classes: { itemCardImg, moderatedCardImg },
  } = useItemConfigureFormStyles();
  const { translate } = useTranslation();
  const { lookDetail, name, description, setName, setDescription } = props;

  const { lookType, curator, lookId, creatingUniverseId } = lookDetail;
  const {
    classes: { thumbnail, iecInfoIcon },
  } = useStyles();
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
      <Grid container alignItems='center' marginBottom={2}>
        <Grid item XSmall={8} Medium={3.5}>
          <Typography variant='h1' style={{ fontSize: '40px', fontWeight: '550' }}>
            {translate('Label.ManageItem')}
          </Typography>
        </Grid>
        <Grid item XSmall={6.5} sx={{ display: { xs: 'none', md: 'block' } }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: 'auto',
                }}>
                <Typography variant='body2' color='secondary'>
                  {translate('Label.CannotBeSold')}
                </Typography>
                <InfoOutlinedIcon classes={{ root: iecInfoIcon }} />
              </div>
            )}
          </div>
        </Grid>
      </Grid>
      <LookUnavailableBanner
        items={lookDetail?.items ?? []}
        creatingUniverseId={lookDetail?.creatingUniverseId}
      />
      <Grid container spacing={2}>
        <Grid item Large={4} XLarge={3.5}>
          <div className={thumbnail}>
            <ItemThumbnail
              containerClass={itemCardImg}
              moderatedContainerClass={moderatedCardImg}
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
        </Grid>
        <Grid item Large={7} XLarge={8}>
          <TextField
            id='name'
            label={translate('Label.ItemName')}
            fullWidth
            margin='normal'
            disabled={false}
            inputProps={{ maxLength: 50 }}
            value={name}
            onChange={(event) => setName(event.target.value)}
            helperText={`${name.length}/50`}
            error={!name?.trim()}
            required
          />
          <TextField
            id='description'
            label={translate('Label.ItemDescription')}
            fullWidth
            multiline
            margin='normal'
            inputProps={{ maxLength: 1000 }}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            helperText={`${description.length}/1000`}
          />
        </Grid>
      </Grid>
    </div>
  );
}

export default LookItemDetails;
