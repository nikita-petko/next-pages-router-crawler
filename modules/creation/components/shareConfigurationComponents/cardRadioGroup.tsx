import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { makeStyles, Radio, RadioGroup } from '@rbx/ui';
import { ReactElement } from 'react';

import { TODOFIXANY } from 'app/shared/types';

export const CardRadioInput = ({
  ariaLabel,
  cardContainerClass = '',
  children,
  disabled,
  labelForId,
  selected,
  value,
}: {
  ariaLabel: string;
  cardContainerClass?: string;
  children: ReactElement<any> | ReactElement<any>[];
  disabled: boolean;
  labelForId: string;
  selected: boolean;
  value: TODOFIXANY;
}) => {
  const {
    classes: {
      cardContainer,
      containerDisabled,
      containerHighlighted,
      containerUnhighlighted,
      radioChecked,
      radioItem,
    },
  } = makeStyles()(() => ({
    cardContainer: {
      borderRadius: 4,
      display: 'flex',
      flexDirection: 'column',
      height: 300,
      padding: '32px 16px',
      width: 260,
    },

    containerDisabled: {
      border: '2px solid rgb(94,95,98) !important',
      opacity: 0.3,
    },

    containerHighlighted: {
      border: '2px solid #2D54FF',
    },

    containerUnhighlighted: {
      border: '2px solid #2C2C2C',
    },

    filterTextBody: {
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 16,
    },

    filterTextBottom: {
      paddingTop: 16,
    },

    radioChecked: {
      position: 'absolute',
      right: 0,
      top: 0,
    },

    radioItem: {
      alignItems: 'center',
      display: 'flex',
      position: 'relative',
    },
  }))();

  const containerClasses = [
    cardContainer,
    selected ? containerHighlighted : containerUnhighlighted,
    disabled ? containerDisabled : '',
    cardContainerClass || '',
  ].join(' ');

  return (
    <label htmlFor={labelForId}>
      <div className={radioItem}>
        <Radio
          aria-label={ariaLabel}
          checkedIcon={<CheckCircleIcon />}
          classes={{ root: radioChecked }}
          disabled={disabled}
          id={labelForId}
          value={value}
        />
        <div className={containerClasses}>{children}</div>
      </div>
    </label>
  );
};

export const CardRadioGroup = ({
  children,
  classes,
  onChange,
  radioGroupName,
  value,
}: {
  children: ReactElement<any> | ReactElement<any>[];
  classes: TODOFIXANY;
  onChange: TODOFIXANY;
  radioGroupName: string;
  value: TODOFIXANY;
}) => {
  return (
    <RadioGroup classes={classes} name={radioGroupName} onChange={onChange} value={value}>
      {children}
    </RadioGroup>
  );
};
