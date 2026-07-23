import { SearchContent, SearchContentCreatorTypeEnum } from '@rbx/clients/rightsV1';
import { Checkbox, Grid, Link } from '@rbx/ui';
import React, { useMemo } from 'react';
import { getUrlForItemType } from '@modules/miscellaneous/common/urls';
import { Item } from '@modules/miscellaneous/common';
import Creator from '@modules/miscellaneous/common/enums/Creator';
import { getCreatorUrl } from '@modules/miscellaneous/common/urls/www';
import LargeContentThumbnail from './LargeContentThumbnail';
import useContentTileStyles from './useContentTileStyles';
import Match from './Match';
import { SearchSource } from './SearchEnums';

function getContentCreatorLink(content: SearchContent) {
  if (!content.creator?.id || !content.creator.type) return '';
  let creatorType: Creator = Creator.User;
  if (content.creator.type === SearchContentCreatorTypeEnum.Group) {
    creatorType = Creator.Group;
  }
  return getCreatorUrl(creatorType, Number(content.creator.id));
}

function getContentNameLink(match: Match) {
  if (!match.searchContent.contentType || !match.searchContent.contentId || !match.source)
    return '';

  switch (match.searchContent.contentType) {
    case 'asset':
      switch (match.source) {
        case SearchSource.Avatar:
          return getUrlForItemType(Item.CatalogAsset, Number(match.searchContent.contentId)) || '';
        case SearchSource.Development:
          return getUrlForItemType(Item.LibraryAsset, Number(match.searchContent.contentId)) || '';
        default:
          return '';
      }
    case 'bundle':
      return getUrlForItemType(Item.Bundle, Number(match.searchContent.contentId)) || '';
    default:
      return '';
  }
}
export interface ContentTileProps {
  match: Match;
  disabled: boolean;
  selected: boolean;
  setSelected: (item: Match) => void;
}
const ContentTile = ({ match, selected, setSelected, disabled }: ContentTileProps) => {
  const { contentName, creator } = match.searchContent;
  const {
    classes: { container, contentCreatorLink, contentNameLink },
  } = useContentTileStyles();
  const contentLink = useMemo(() => getContentNameLink(match), [match]);
  const creatorLink = useMemo(
    () => getContentCreatorLink(match.searchContent),
    [match.searchContent],
  );
  return (
    <Grid className={container} direction='column' item container>
      <Grid
        data-testid='clickableimage'
        sx={{ position: 'relative', padding: '10px' }}
        item
        onClick={() => {
          if (disabled) return;
          setSelected(match);
        }}>
        <LargeContentThumbnail content={match.searchContent} selected={selected} />
        <Checkbox
          sx={{ position: 'absolute', top: '5px', left: '5px' }}
          color='secondary'
          checked={selected}
        />
      </Grid>
      <Grid item container direction='row' height='50px' p={1}>
        <Grid item>
          <Link
            className={contentNameLink}
            href={contentLink}
            rel='noopener noreferrer'
            target='_blank'
            variant='h6'>
            {contentName}
          </Link>
        </Grid>
        <Grid item>
          <Link
            rel='noopener noreferrer'
            target='_blank'
            className={contentCreatorLink}
            href={creatorLink}
            variant='body2'>
            {`@${creator?.displayName || '---'}`}
          </Link>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default React.memo(ContentTile);
