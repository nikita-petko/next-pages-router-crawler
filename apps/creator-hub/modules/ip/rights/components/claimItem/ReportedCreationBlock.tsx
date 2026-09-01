import Link from 'next/link';
import type { FunctionComponent } from 'react';
import type { ClaimItem, ClaimContentContentTypeEnum } from '@rbx/client-rights/v1';
import { withTranslation } from '@rbx/intl';
import { Thumbnail2d, ReturnPolicy } from '@rbx/thumbnails';
import { Grid, Typography, Link as UILink } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getGroupUrl, getUserUrl } from '@modules/miscellaneous/urls/www';
import contentTypeToThumbnailType from '../../helpers/getThumbnailType';
import type { ContentDetails } from '../../hooks/useContentDetails';
import { getPrefixedCreatorName } from '../../hooks/useContentDetails';
import useClaimItemDetailStyles from './useClaimItemDetailStyles';

interface ReportedCreationBlockProps {
  claimItem: ClaimItem;
  translate: (key: string) => string;
  contentId: number;
  contentType: ClaimContentContentTypeEnum;
  contentDetails: ContentDetails;
  contentError: boolean;
  isAllegedInfringer: boolean;
}

const ReportedCreationBlock: FunctionComponent<ReportedCreationBlockProps> = ({
  claimItem,
  translate,
  contentId,
  contentType,
  contentDetails,
  contentError,
  isAllegedInfringer,
}) => {
  const {
    classes: { image, container, border, creationBlock, contentBlock, contentLink },
  } = useClaimItemDetailStyles();
  const contentURL = claimItem?.contents?.[0].url ?? '';
  let creatorURL = '';
  if (contentDetails.creatorType === 'Group') {
    creatorURL = getGroupUrl(Number(contentDetails.creatorId));
  } else {
    creatorURL = getUserUrl(Number(contentDetails.creatorId));
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
          targetId={contentId}
          skeletonVariant='rectangular'
          type={contentTypeToThumbnailType(contentType)}
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
                  {contentDetails.contentName}
                </UILink>
              </Link>
            )}
            {!contentURL && <Typography color='inherit'>{contentDetails.contentName}</Typography>}
          </Grid>
          <Grid item XSmall={12}>
            <Link href={creatorURL} passHref legacyBehavior>
              <UILink color='inherit' target='_blank'>
                {getPrefixedCreatorName(contentDetails.creatorType, contentDetails.creatorName)}
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
