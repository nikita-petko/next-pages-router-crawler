import type { FunctionComponent, ReactNode } from 'react';
import { Toggle } from '@rbx/foundation-ui';
import { Typography } from '@rbx/ui';
import useServiceConfigurationFormStyles from '../ServiceConfigurationForm/ServiceConfigurationForm.styles';
import useUnlockToggleRowStyles from './UnlockToggleRow.styles';

type UnlockToggleRowProps = {
  title: string;
  description?: ReactNode;
  isChecked: boolean;
  isDisabled?: boolean;
  ariaLabel?: string;
  onCheckedChange?: (checked: boolean) => void;
};

const UnlockToggleRow: FunctionComponent<UnlockToggleRowProps> = ({
  title,
  description,
  isChecked,
  isDisabled,
  ariaLabel,
  onCheckedChange,
}) => {
  const {
    classes: { resourceTitle, resourceDescription },
  } = useServiceConfigurationFormStyles();
  const {
    classes: { root, toggleWrapper, textContainer },
  } = useUnlockToggleRowStyles();

  return (
    <div className={root}>
      <div className={toggleWrapper}>
        <Toggle
          size='Medium'
          placement='Start'
          isChecked={isChecked}
          isDisabled={isDisabled}
          aria-label={ariaLabel ?? title}
          onCheckedChange={onCheckedChange}
        />
      </div>
      <div className={textContainer}>
        <Typography variant='subtitle2' component='div' className={resourceTitle}>
          {title}
        </Typography>
        {description ? (
          <Typography variant='body2' className={resourceDescription}>
            {description}
          </Typography>
        ) : null}
      </div>
    </div>
  );
};

export default UnlockToggleRow;
