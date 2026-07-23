import type { FC, ReactNode } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { CircularProgress, Grid, InfoOutlinedIcon, Select, Tooltip, Typography } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useFilterDrawerStyles from './FilterDrawer.styles';

const FilterChoiceWrapper: FC<
  React.PropsWithChildren<{
    name: FormattedText;
    description?: ReactNode;
    isLoading?: boolean;
    showNoData?: boolean;
  }>
> = ({ children, name, description, isLoading, showNoData }) => {
  const {
    classes: { choiceHeader, choiceContainer, choiceLoadingCircularSpinner, choiceInfoIcon },
  } = useFilterDrawerStyles();
  const { translate } = useTranslationWrapper(useTranslation());
  const infoIcon = description ? (
    <Tooltip title={description} arrow>
      <InfoOutlinedIcon
        className={choiceInfoIcon}
        fontSize='small'
        data-testid='filter-drawer-choice-description-icon'
      />
    </Tooltip>
  ) : null;

  const wrapped = (body: ReactNode, headingName: ReactNode, headingIcon: ReactNode) => {
    return (
      <Grid container direction='column' className={choiceContainer}>
        <Grid item container direction='row' alignItems='center'>
          <Typography variant='smallLabel2' className={choiceHeader}>
            {headingName}
          </Typography>
          {headingIcon}
        </Grid>
        {body}
      </Grid>
    );
  };

  if (isLoading) {
    return wrapped(
      null,
      name,
      <>
        {infoIcon}
        <CircularProgress size={14} color='secondary' className={choiceLoadingCircularSpinner} />
      </>,
    );
  }

  if (showNoData) {
    return wrapped(
      <Select
        disabled
        size='small'
        helperText={translate(
          translationKey('Label.NoValuesAvailable', TranslationNamespace.Analytics),
        )}
      />,
      name,
      infoIcon,
    );
  }

  return wrapped(children, name, infoIcon);
};
export default FilterChoiceWrapper;
