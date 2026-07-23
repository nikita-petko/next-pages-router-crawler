// Adapted from creator-hub: https://github.rbx.com/Roblox/creator-hub/blob/master/apps/creator-hub/modules/charts-generic/components/FilterDrawer/FilterChoiceWrapper.tsx

import { CircularProgress, Grid, Select, Typography } from '@rbx/ui';
import { PropsWithChildren, ReactNode } from 'react';

import useFilterDrawerStyles from './FilterDrawer.styles';

interface FilterChoiceWrapperProps {
  isLoading?: boolean;
  name: ReactNode;
  showNoData?: boolean;
}

const FilterChoiceWrapper = ({
  children,
  isLoading,
  name,
  showNoData,
}: PropsWithChildren<FilterChoiceWrapperProps>) => {
  const {
    classes: { choiceContainer, choiceHeader, choiceLoadingCircularSpinner },
  } = useFilterDrawerStyles();
  const wrapped = (body: ReactNode, headingName: ReactNode, headingIcon: ReactNode) => {
    return (
      <Grid className={choiceContainer} container direction='column'>
        <Grid alignItems='center' container direction='row' item>
          {headingName !== '' && (
            <Typography className={choiceHeader} variant='smallLabel2'>
              {headingName}
            </Typography>
          )}
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
      <CircularProgress className={choiceLoadingCircularSpinner} color='secondary' size={14} />,
    );
  }

  if (showNoData) {
    return wrapped(
      <Select disabled helperText='Label.NoValuesAvailable TODO' size='small' />,
      name,
      null,
    );
  }

  return wrapped(children, name, null);
};
export default FilterChoiceWrapper;
