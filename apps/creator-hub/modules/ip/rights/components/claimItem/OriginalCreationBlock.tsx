import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ClaimItem, ClaimContentContentTypeEnum, ClaimItemSourceEnum } from '@rbx/clients/rightsV1';
import { withTranslation } from '@rbx/intl';
import { Thumbnail2d, ReturnPolicy } from '@rbx/thumbnails';
import { Grid, Typography, Link as UILink, PersonIcon } from '@rbx/ui';
import Link from 'next/link';
import React, { FunctionComponent } from 'react';
import { getGroupUrl, getUserUrl } from '@modules/miscellaneous/common/urls/www';
import contentTypeToThumbnailType from '../../helpers/getThumbnailType';
import useClaimItemDetailStyles from './useClaimItemDetailStyles';

interface OriginalCreationBlockProps {
  claimItem: ClaimItem;
  translate: (key: string) => string;
  originalContentName: string;
  originalContentId: number;
  originalContentType: ClaimContentContentTypeEnum;
  originalCreatorName: string;
  originalCreatorId: string;
  isAllegedInfringer: boolean;
}

const OriginalCreationBlock: FunctionComponent<OriginalCreationBlockProps> = ({
  claimItem,
  translate,
  originalContentName,
  originalContentId,
  originalContentType,
  originalCreatorName,
  originalCreatorId,
  isAllegedInfringer,
}) => {
  const {
    classes: {
      image,
      container,
      border,
      link,
      blankContainer,
      creationBlock,
      contentBlock,
      contentLink,
    },
  } = useClaimItemDetailStyles();
  const isExternal = claimItem?.source !== ClaimItemSourceEnum.OnRoblox;
  const originalContentUrl = claimItem?.content?.url ?? '';
  let contents: React.JSX.Element;
  if (isExternal) {
    let claimant: React.JSX.Element;
    if (!isAllegedInfringer) {
      claimant = <div>{translate('Message.ClaimantYou')}</div>;
    } else if (claimItem.account?.ownerType === 'RobloxGroup') {
      claimant = (
        <Link href={getGroupUrl(Number(claimItem.account?.ownerId))} passHref legacyBehavior>
          <UILink color='inherit' target='_blank'>
            {translate('Message.ClaimantGroup')}
          </UILink>
        </Link>
      );
    } else {
      claimant = (
        <Link href={getUserUrl(Number(claimItem.account?.ownerId))} passHref legacyBehavior>
          <UILink color='inherit' target='_blank'>
            {translate('Message.ClaimantCreator')}
          </UILink>
        </Link>
      );
    }

    contents = (
      <Grid container item XSmall rowSpacing={2}>
        <Grid item XSmall={12} container>
          <div className={isAllegedInfringer ? blankContainer : `${blankContainer} ${border}`}>
            <PersonIcon className={link} />
          </div>
        </Grid>
        <Grid container item rowSpacing={1} XSmall={12}>
          <Grid item XSmall={12} overflow='hidden'>
            <Typography variant='body2' color='inherit'>
              {translate('Label.OffPlatformCreation')}
            </Typography>
          </Grid>
          <Grid item XSmall={12} overflow='hidden'>
            {claimant}
          </Grid>
        </Grid>
      </Grid>
    );
  } else {
    contents = (
      <Grid container item XSmall rowSpacing={2}>
        <Grid item XSmall={12}>
          <Thumbnail2d
            imgClassName={image}
            targetId={originalContentId!}
            skeletonVariant='rectangular'
            type={contentTypeToThumbnailType(originalContentType!)}
            alt={translate('Label.ContentPreview')}
            containerClass={isAllegedInfringer ? container : `${container}  ${border}`}
            returnPolicy={ReturnPolicy.PlaceHolder}
            includeBackground
          />
        </Grid>

        <Grid container item rowSpacing={1} XSmall={12} className={contentBlock}>
          <Grid item XSmall={12} className={contentLink}>
            <Link href={originalContentUrl} passHref legacyBehavior>
              <UILink color='inherit' target='_blank'>
                {originalContentName}
              </UILink>
            </Link>
          </Grid>
          <Grid item XSmall={12}>
            <Link href={getUserUrl(Number(originalCreatorId))} passHref legacyBehavior>
              <UILink color='inherit' target='_blank'>
                @{originalCreatorName}
              </UILink>
            </Link>
          </Grid>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid XSmall rowSpacing={2} container item className={creationBlock}>
      <Grid item XSmall={12}>
        <Typography variant='body2' color='secondary'>
          {isAllegedInfringer
            ? translate('Label.ClaimantsCreation')
            : translate('Label.MyCreation')}
        </Typography>
      </Grid>
      {contents}
    </Grid>
  );
};
export default withTranslation(OriginalCreationBlock, [TranslationNamespace.RightsPortal]);
