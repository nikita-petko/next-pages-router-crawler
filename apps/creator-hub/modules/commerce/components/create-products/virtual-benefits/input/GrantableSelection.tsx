import Link from 'next/link';
import { Fragment } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  InfoOutlinedIcon,
  Tooltip,
  Typography,
  IconButton,
} from '@rbx/ui';
import type { CommerceGrantableModel } from '@modules/clients/commerce';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useStyles from '../styles';

interface GrantableSelectionProps {
  title: string;
  hasPrevious: boolean;
  hasNext: boolean;
  onSelect: (grantableItem: CommerceGrantableModel) => void;
  onPrevious: () => void;
  onNext: () => void;
  grantableItems: CommerceGrantableModel[];
  tooltipText?: string;
}

const GrantableSelection = ({
  title,
  hasPrevious,
  hasNext,
  onSelect,
  onPrevious,
  onNext,
  grantableItems,
  tooltipText,
}: GrantableSelectionProps) => {
  const { translateHTML } = useTranslation();
  const { classes } = useStyles();

  return (
    <>
      <div className={classes.grantableSelectionContainer}>
        <div className={classes.avatarSelectionContainerTitle}>
          <Typography mr={1} variant='subtitle2'>
            {title}
          </Typography>
          {tooltipText && (
            <Tooltip title={tooltipText}>
              <InfoOutlinedIcon fontSize='small' />
            </Tooltip>
          )}
        </div>
        <div className={classes.grantableItemContainer}>
          {grantableItems.map((item) => (
            <div key={item.grantableAssetId} className={classes.grantableSelectionRow}>
              <input
                type='radio'
                name='avatarItem'
                onChange={() => onSelect(item)}
                style={{
                  marginRight: 16,
                  width: 20,
                  height: 20,
                }}
              />
              <Thumbnail2d
                alt={item.name ?? ''}
                targetId={item.imageAssetId ?? 0}
                includeBackground
                imgClassName={classes.grantableThumbnailContainerImage}
                containerClass={classes.grantableThumbnailContainer}
                type={ThumbnailTypes.assetThumbnail}
              />
              <Typography variant='body2'>{item.name}</Typography>
            </div>
          ))}
        </div>
      </div>
      <div className={classes.grantableSelectionPaginationContainer}>
        <IconButton
          size='medium'
          color='secondary'
          disabled={!hasPrevious}
          onClick={onPrevious}
          aria-label='left'>
          <ChevronLeftIcon />
        </IconButton>
        <IconButton
          size='medium'
          color='secondary'
          disabled={!hasNext}
          onClick={onNext}
          aria-label='left'>
          <ChevronRightIcon />
        </IconButton>
      </div>

      <Typography sx={{ pl: 2, pr: 2, pt: 2 }} variant='caption'>
        {translateHTML('Label.VirtualBenefitQualificationsHelpText', [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content(chunks) {
              return (
                <Link href={`https://help.${process.env.robloxSiteDomain}/`} target='_blank'>
                  {chunks}
                </Link>
              );
            },
          },
        ])}
      </Typography>
    </>
  );
};

export default withTranslation(GrantableSelection, [
  TranslationNamespace.Commerce,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.Creations,
]);
