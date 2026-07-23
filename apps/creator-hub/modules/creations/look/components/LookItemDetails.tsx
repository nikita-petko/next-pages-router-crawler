import React from 'react';
import { TextField, Typography, Grid, Chip, Tooltip, makeStyles } from '@rbx/ui';
import {
  Item,
  itemTypeToThumbnailType,
  itemTypeToReturnPolicyType,
} from '@modules/miscellaneous/common';
import { ReturnPolicy } from '@rbx/thumbnails';
import { useTranslation } from '@rbx/intl';
import { CreatorType, LookDetailV2 } from '@rbx/clients/lookApi';
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
}));

function LookItemDetails(props: LookItemDetailsProps) {
  const {
    classes: { itemCardImg, moderatedCardImg },
  } = useItemConfigureFormStyles();
  const { translate } = useTranslation();
  const { lookDetail, name, description, setName, setDescription } = props;

  const { lookType, curator, lookId } = lookDetail;
  const {
    classes: { thumbnail },
  } = useStyles();

  const isGroup = curator?.type === CreatorType.Group;
  const targetId = lookId ? (lookId as unknown as number) : 0;

  const chipImage = `${process.env.assetPathPrefix}/looks/${lookType?.toLowerCase()}.svg`;
  const defaultImage = `${process.env.assetPathPrefix}/looks/makeup.svg`;

  return (
    <div>
      <Grid container alignItems='center' marginBottom={2}>
        <Grid item XSmall={8} Medium={3.5}>
          <Typography variant='h1'>{translate('Label.ManageItem')}</Typography>
        </Grid>
        <Grid item XSmall={6.5} sx={{ display: { xs: 'none', md: 'block' } }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Tooltip title={translate('Label.ItemTypeDescription')} placement='top'>
              <Chip
                icon={
                  <img
                    src={chipImage}
                    alt='icon'
                    style={{ padding: '5px' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== defaultImage) {
                        target.src = defaultImage;
                      }
                    }}
                  />
                }
                variant='outlined'
                color='secondary'
                label={translate(`Label.${lookType}`)}
              />
            </Tooltip>
          </div>
        </Grid>
      </Grid>
      <LookUnavailableBanner items={lookDetail?.items || []} />
      <Grid container spacing={2}>
        <Grid item Large={4} XLarge={3.5}>
          <div className={thumbnail}>
            <ItemThumbnail
              containerClass={itemCardImg}
              moderatedContainerClass={moderatedCardImg}
              type={itemTypeToThumbnailType[Item.Look]}
              targetId={targetId}
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
