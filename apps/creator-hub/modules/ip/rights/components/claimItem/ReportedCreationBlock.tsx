import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ClaimItem, ClaimContentContentTypeEnum } from '@rbx/clients/rightsV1';
import { withTranslation } from '@rbx/intl';
import { Thumbnail2d, ReturnPolicy } from '@rbx/thumbnails';
import { Grid, Typography, Link as UILink } from '@rbx/ui';
import Link from 'next/link';
import React, { FunctionComponent } from 'react';
import { getGroupUrl, getUserUrl } from '@modules/miscellaneous/common/urls/www';
import { CreatorType } from '../../hooks/useContentDetails';
import useClaimItemDetailStyles from './useClaimItemDetailStyles';
import contentTypeToThumbnailType from '../../helpers/getThumbnailType';

interface ReportedCreationBlockProps {
  claimItem: ClaimItem;
  translate: (key: string) => string;
  contentName: string;
  contentId: number;
  contentType: ClaimContentContentTypeEnum;
  contentError: boolean;
  creatorName: string;
  creatorId: string;
  creatorType?: CreatorType;
  isAllegedInfringer: boolean;
}

const ReportedCreationBlock: FunctionComponent<ReportedCreationBlockProps> = ({
  claimItem,
  translate,
  contentName,
  contentId,
  contentType,
  contentError,
  creatorName,
  creatorId,
  creatorType,
  isAllegedInfringer,
}) => {
  const {
    classes: { image, container, border, creationBlock, contentBlock, contentLink },
  } = useClaimItemDetailStyles();
  const contentURL = claimItem?.contents?.[0].url ?? '';
  let creatorURL = '';
  if (creatorType === 'Group') {
    creatorURL = getGroupUrl(Number(creatorId));
  } else {
    creatorURL = getUserUrl(Number(creatorId));
  }

  return (
    <Grid XSmall rowSpacing={2} container item className={creationBlock}>
      <Grid item XSmall={12}>
        <Typography variant='body2' color='secondary'>
          {isAllegedInfringer ? translate('Label.MyCreation') : translate('Label.ReportedCreation')}
        </Typography>
      </Grid>
      <Grid item XSmall={12} container>
        <Thumbnail2d
          imgClassName={image}
          targetId={contentId!}
          skeletonVariant='rectangular'
          type={contentTypeToThumbnailType(contentType!)}
          alt={translate('Label.ContentPreview')}
          containerClass={isAllegedInfringer ? `${container} ${border}` : container}
          returnPolicy={ReturnPolicy.PlaceHolder}
          includeBackground
        />
      </Grid>
      {!contentError && (
        <Grid container item rowSpacing={1} XSmall={12} className={contentBlock}>
          <Grid item XSmall={12} className={contentLink}>
            {contentURL && (
              <Link href={contentURL} passHref legacyBehavior>
                <UILink color='inherit' target='_blank'>
                  {contentName}
                </UILink>
              </Link>
            )}
            {!contentURL && <Typography color='inherit'>{contentName}</Typography>}
          </Grid>
          <Grid item XSmall={12}>
            <Link href={creatorURL} passHref legacyBehavior>
              <UILink color='inherit' target='_blank'>
                @{creatorName}
              </UILink>
            </Link>
          </Grid>
        </Grid>
      )}
      {!!contentError && (
        <Grid item XSmall={12}>
          <Typography variant='body2' color='primary'>
            {translate('Label.ID')}: {contentId}
          </Typography>
        </Grid>
      )}
    </Grid>
  );
};
export default withTranslation(ReportedCreationBlock, [TranslationNamespace.RightsPortal]);
