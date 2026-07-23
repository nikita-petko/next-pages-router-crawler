import { Checkbox, Icon } from '@rbx/foundation-ui';
import { Tooltip, Typography } from '@rbx/ui';
import React, { useId, useState } from 'react';

import useAdvancedTargetingLocationAutocompleteStyles from '@components/campaignBuilder/targeting/AdvancedTargetingLocationAutocomplete.styles';
import { TranslationNamespace } from '@constants/localization';
import { CheckboxState, RowType } from '@constants/locationAutocomplete';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { RegionsAndLocationsFormInputObj } from '@type/locationAutocomplete';
import { GetRegionToCountryMap } from '@utils/locationAutocomplete';

interface ExpandingSelectionRowProps {
  carrotExpanded: boolean;
  checkboxState: CheckboxState;
  locationInfo: RegionsAndLocationsFormInputObj;
  onCarrotClick: (locationInfo: RegionsAndLocationsFormInputObj) => void;
  onRowToggle: () => void;
  rowType: RowType;
  showTooltipOnhover: boolean;
}

const ExpandingSelectionRow = ({
  carrotExpanded,
  checkboxState = CheckboxState.UNCHECKED,
  locationInfo,
  onCarrotClick,
  onRowToggle,
  rowType,
  showTooltipOnhover = false,
}: ExpandingSelectionRowProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const rowLabelId = useId();
  const [tooltipOpen, setTooltipOpen] = useState<boolean>(false);
  const isRegion = rowType === RowType.REGION;
  const isSuperGroup = rowType === RowType.SUPER_GROUP;

  const {
    classes: {
      countryRow,
      regularRow,
      sectionExpandToggleIconContainer,
      sectionExpansionContainer,
    },
  } = useAdvancedTargetingLocationAutocompleteStyles();

  const handleRowClick = (event: React.MouseEvent | React.KeyboardEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onRowToggle();
  };

  return (
    <div
      className={`${sectionExpansionContainer} cursor-pointer`}
      onBlur={() => null} // onMouseOut must be accompanied by onBlur for accessibility
      onClick={handleRowClick}
      onFocus={() => null} // onMouseOver must be accompanied by onFocus for accessibility
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault(); // Prevent default scrolling for Space key
          handleRowClick(e); // Trigger click logic on Enter/Space
        }
      }}
      onMouseOut={() => setTooltipOpen(false)}
      onMouseOver={() => setTooltipOpen(true)}
      role='button'
      tabIndex={0}>
      <div>
        <div
          className={`flex items-center gap-small ${isRegion || isSuperGroup ? regularRow : countryRow}`}>
          <Tooltip
            arrow
            open={tooltipOpen && showTooltipOnhover}
            placement='top'
            title={translate('Description.MaxLocationsAllowed')}>
            <Checkbox
              aria-labelledby={rowLabelId}
              isChecked={
                checkboxState === CheckboxState.PARTIAL
                  ? 'indeterminate'
                  : checkboxState === CheckboxState.CHECKED
              }
              placement='Start'
              size='XSmall'
            />
          </Tooltip>
          <div>
            <Typography color='primary' id={rowLabelId} variant='body1'>
              {locationInfo.title}
            </Typography>
            {locationInfo.parentRegion &&
              Boolean(GetRegionToCountryMap()[locationInfo.regionCode]?.length) && (
                <div
                  className={sectionExpandToggleIconContainer}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    onCarrotClick(locationInfo);
                  }}
                  onKeyDown={() => null}
                  role='button'
                  tabIndex={0}>
                  {carrotExpanded ? (
                    <Icon
                      data-testid='expandLessIcon'
                      name='icon-regular-chevron-small-up'
                      size='Medium'
                    />
                  ) : (
                    <Icon
                      data-testid='expandMoreIcon'
                      name='icon-regular-chevron-small-down'
                      size='Medium'
                    />
                  )}
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpandingSelectionRow;
