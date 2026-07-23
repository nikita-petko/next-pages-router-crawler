import { FunctionComponent } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ClaimContentContentTypeEnum, ClaimItemSourceEnum } from '@rbx/clients/rightsV1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d } from '@rbx/thumbnails';
import { Avatar, CircularProgress, Grid, makeStyles, Typography, Link as UILink } from '@rbx/ui';
import Link from 'next/link';
import { getGroupUrl, getUserUrl } from '@modules/miscellaneous/common/urls/www';
import contentTypeToThumbnailType from '../../helpers/getThumbnailType';
import { ContentDetails } from '../../hooks/useContentDetails';

const useStyles = makeStyles()(() => ({
  contentBlock: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  contentLink: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}));

export interface ContentGridLayoutProps {
  contentId: number;
  contentType: ClaimContentContentTypeEnum;
  originalLink?: string;
  sourceOfCreation?: ClaimItemSourceEnum;
  isMyCreation?: boolean;
  showCreatorName?: boolean;
  isPending: boolean;
  error: Error | null;
  contentDetails: ContentDetails;
}

const ContentGridLayout: FunctionComponent<ContentGridLayoutProps> = ({
  contentId,
  contentType,
  originalLink,
  sourceOfCreation,
  isMyCreation,
  showCreatorName = true,
  isPending,
  error,
  contentDetails,
}) => {
  const { ready, translate } = useTranslation();
  const {
    classes: { contentBlock, contentLink },
  } = useStyles();

  let reportedUserURL = '';
  if (contentDetails?.creatorType === 'Group') {
    reportedUserURL = getGroupUrl(Number(contentDetails?.creatorId));
  } else {
    reportedUserURL = getUserUrl(Number(contentDetails?.creatorId));
  }
  const urlWasParsedAsExternal = contentType === ClaimContentContentTypeEnum.External;
  const isOffPlatform = isMyCreation && sourceOfCreation === ClaimItemSourceEnum.OutsideOfRoblox;
  if (originalLink && (isOffPlatform || urlWasParsedAsExternal)) {
    return (
      <Grid item container direction='column' XSmall className={contentBlock}>
        <Grid item className={contentLink}>
          <Link href={originalLink} passHref legacyBehavior>
            <UILink
              variant='body2'
              color='inherit'
              target='_blank'
              onClick={(event) => event.stopPropagation()}>
              {originalLink}
            </UILink>
          </Link>
        </Grid>
      </Grid>
    );
  }
  if (isPending || !ready) {
    return <CircularProgress />;
  }

  const thumbnail = (
    <Grid item>
      <Avatar variant='square' alt={translate('Label.ContentPreview')}>
        <Thumbnail2d
          targetId={contentId}
          type={contentTypeToThumbnailType(contentType)}
          alt={translate('Label.ContentPreview')}
          returnPolicy={ReturnPolicy.PlaceHolder}
          includeBackground={false}
        />
      </Avatar>
    </Grid>
  );

  return (
    <Grid container spacing={2} flexWrap='nowrap'>
      {thumbnail}
      {!!error && (
        <Grid item container direction='column' XSmall zeroMinWidth flexWrap='nowrap'>
          <Typography noWrap variant='body2'>
            {translate('Label.ID')}: {contentId}
          </Typography>
          <Typography noWrap variant='body2' color='error'>
            {translate('Label.CouldNotFetchCreation')}
          </Typography>
        </Grid>
      )}
      {!error && (
        <Grid item container direction='column' XSmall className={contentBlock}>
          <Grid item className={contentLink}>
            {contentDetails?.contentName !== '' ? (
              <Link href={originalLink ?? ''} passHref legacyBehavior>
                <UILink
                  variant='body2'
                  color='inherit'
                  target='_blank'
                  onClick={(event) => event.stopPropagation()}>
                  {contentDetails?.contentName}
                </UILink>
              </Link>
            ) : (
              <Typography noWrap variant='body2'>
                {translate('Label.OffPlatformCreation')}
              </Typography>
            )}
          </Grid>
          <Grid item className={contentLink}>
            {showCreatorName && contentDetails?.creatorName && (
              <Link href={reportedUserURL} passHref legacyBehavior>
                <UILink
                  variant='body2'
                  color='inherit'
                  target='_blank'
                  onClick={(event) => event.stopPropagation()}>
                  @{contentDetails?.creatorName}
                </UILink>
              </Link>
            )}
          </Grid>
        </Grid>
      )}
    </Grid>
  );
};

export default withTranslation(ContentGridLayout, [TranslationNamespace.RightsPortal]);
