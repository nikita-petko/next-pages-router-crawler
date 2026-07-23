import { Radio, RadioGroup } from '@rbx/ui';

import { TODOFIXANY } from 'app/shared/types';

interface ConfigurationRadioOptionConfig {
  ariaLabel: string;
  classForLabel?: string;
  disabled: boolean;
  displayLabel: string;
  optionId: string;
  value: string;
}

const ConfigurationRadioOption = ({
  ariaLabel,
  classForLabel,
  disabled,
  displayLabel,
  optionId,
  value,
}: ConfigurationRadioOptionConfig) => {
  return (
    <label className={classForLabel} htmlFor={optionId}>
      <Radio
        aria-label={ariaLabel}
        color='primary'
        disabled={disabled}
        id={optionId}
        size='medium'
        value={value}
      />
      {displayLabel}
    </label>
  );
};

export const ConfigurationRadioGroup = ({
  classes,
  onChange,
  radioGroupName,
  radioGroupOptions,
  value,
}: {
  classes: TODOFIXANY;
  onChange: TODOFIXANY;
  radioGroupName: string;
  radioGroupOptions: ConfigurationRadioOptionConfig[];
  value: TODOFIXANY;
}) => {
  return (
    <RadioGroup classes={classes} name={radioGroupName} onChange={onChange} value={value}>
      {radioGroupOptions.map((radioOptionProps: ConfigurationRadioOptionConfig) => {
        return <ConfigurationRadioOption key={radioOptionProps.optionId} {...radioOptionProps} />;
      })}
    </RadioGroup>
  );
};
