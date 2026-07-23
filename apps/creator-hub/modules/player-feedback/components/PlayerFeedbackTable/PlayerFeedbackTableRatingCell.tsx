import React, { FunctionComponent } from 'react';
import {
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  makeStyles,
  ThumbUpIcon,
  ThumbDownIcon,
  Skeleton,
} from '@rbx/ui';
import { ExperienceReview } from '@rbx/clients/playerGeneratedReviewsService';
import { useTranslation } from '@rbx/intl';
import { useSettings } from '@modules/settings';
import PlayerFeedbackContextMenu from './PlayerFeedbackContextMenu';
import { CategoryType, CategoryTypeLabelKey } from './constants/PlayerFeedbackTableConfigs';
import { TranslationState } from './types/types';

type PlayerFeedbackTableRatingCellProps = {
  review: ExperienceReview;
  renderConextMenu: boolean;
  translationState?: TranslationState;
};

const useStyles = makeStyles()((theme) => ({
  listIcon: {
    minWidth: 0,
    margin: '0px 4px',
    [theme.breakpoints.down('Medium')]: {
      marginLeft: -4,
    },
  },
}));

const PlayerFeedbackTableRatingCell: FunctionComponent<PlayerFeedbackTableRatingCellProps> = ({
  review,
  renderConextMenu,
  translationState,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { listIcon },
  } = useStyles();
  const { settings } = useSettings();

  // Use translation state from props or provide defaults
  const {
    showTranslation = false,
    isTranslating = false,
    translationData,
    onClickTranslateComment = () => {},
  } = translationState || {};

  const categoryType = review.categoryType as CategoryType;
  const labelKey = CategoryTypeLabelKey[categoryType];
  const translated = translate(labelKey);
  const isLabelLoading = translated === labelKey || !translated;

  // Conditionally show leading icon when the flag is disabled
  let LeadingIcon: typeof ThumbUpIcon | typeof ThumbDownIcon | undefined;
  if (!settings.enablePlayerFeedbackUnrated) {
    switch (categoryType) {
      case CategoryType.Upvote:
        LeadingIcon = ThumbUpIcon;
        break;
      case CategoryType.Downvote:
        LeadingIcon = ThumbDownIcon;
        break;
      default:
        LeadingIcon = undefined;
    }
  } else {
    LeadingIcon = undefined;
  }
  return (
    <List disablePadding dense data-category-type={categoryType}>
      <ListItem disableGutters>
        {LeadingIcon ? <LeadingIcon className={listIcon} color='secondary' /> : null}
        <ListItemText
          primary={
            isLabelLoading ? (
              <Skeleton animate variant='text' height={12} width='40%' />
            ) : (
              translated
            )
          }
        />
        {renderConextMenu && (
          <ListItemSecondaryAction>
            <PlayerFeedbackContextMenu
              review={review}
              onTranslationToggle={onClickTranslateComment}
              isTranslating={isTranslating}
              showTranslation={showTranslation}
              isTranslated={Boolean(translationData && translationData.translatedComment)}
              setShowMenuIcon={() => {}}
            />
          </ListItemSecondaryAction>
        )}
      </ListItem>
    </List>
  );
};
export default PlayerFeedbackTableRatingCell;
