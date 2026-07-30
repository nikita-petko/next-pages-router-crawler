import type { ChangeEvent, FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, MenuItem, Select, Typography, makeStyles } from '@rbx/ui';
import type { AvatarItemDropdown } from '../constants/avatarItemConstants';
import { taxonomyOptionLabel, taxonomyOptionValue } from '../utils/taxonomyCategoriesUtils';

const useStyles = makeStyles()({
  root: {
    marginTop: 0,
    marginBottom: 24,
  },
});

export interface TaxonomyCategorySelectorProps {
  /** Sub-categories (L2) for the active L1; empty when the L1 has no children. */
  l2Options: AvatarItemDropdown[];
  /** Display name of the active L1, used to label the sub-selector (e.g. "Body Type"). */
  categoryName?: string;
  /** Identifier of the sub-category currently applied to the grid (see `taxonomyOptionValue`). */
  selectedOptionValue?: string;
  onSelectL2: (option: AvatarItemDropdown) => void;
  isLoading?: boolean;
}

/**
 * Sub-category selector for the active taxonomy L1. The L1 chips themselves live in the Avatar
 * Items toolbar (see TaxonomyL1Chips).
 */
const TaxonomyCategorySelector: FunctionComponent<
  React.PropsWithChildren<TaxonomyCategorySelectorProps>
> = ({ l2Options, categoryName, selectedOptionValue, onSelectL2, isLoading }) => {
  const {
    classes: { root },
  } = useStyles();
  const { translate } = useTranslation();

  if (isLoading) {
    return (
      <Grid classes={{ root }} container direction='row' alignItems='center'>
        <Typography variant='body1'>{translate('Label.Loading')}</Typography>
      </Grid>
    );
  }

  const l2Value = l2Options.some((option) => taxonomyOptionValue(option) === selectedOptionValue)
    ? selectedOptionValue
    : (l2Options[0] && taxonomyOptionValue(l2Options[0])) || '';

  if (l2Options.length === 0) {
    return null;
  }

  // Mirrors the item-type sub-selector: a "Filters:" prefix and a labelled, quarter-width dropdown.
  return (
    <Grid classes={{ root }} container direction='row' alignItems='center' spacing={3}>
      <Grid item>
        <Typography align='left' variant='body1'>
          {translate('Label.Filters')}
        </Typography>
      </Grid>
      <Grid item XSmall={3}>
        <Select
          fullWidth
          label={translate('Label.CategoryType', { categoryNameSingular: categoryName ?? '' })}
          margin='normal'
          variant='outlined'
          value={l2Value}
          onChange={(event: ChangeEvent<{ value: string }>) => {
            const selected = l2Options.find(
              (option) => taxonomyOptionValue(option) === event.target.value,
            );
            if (selected) {
              onSelectL2(selected);
            }
          }}>
          {l2Options.map((option) => (
            <MenuItem key={taxonomyOptionValue(option)} value={taxonomyOptionValue(option)}>
              {taxonomyOptionLabel(option, translate)}
            </MenuItem>
          ))}
        </Select>
      </Grid>
    </Grid>
  );
};

export default TaxonomyCategorySelector;
