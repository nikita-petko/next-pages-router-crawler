import type { FC } from 'react';
import React from 'react';
import { Button, Tooltip } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import useChartExportButtonStyles from './ChartExportButton.styles';

const GenericChartHeaderButton: FC<React.PropsWithChildren<{ tooltip: FormattedText }>> = ({
  tooltip,
  children,
}) => {
  const {
    classes: { button },
  } = useChartExportButtonStyles();
  return (
    <Tooltip arrow title={tooltip} data-testid='tooltip' enterDelay={0}>
      <Button aria-label={tooltip} color='inherit' size='small' className={button} disableRipple>
        {children}
      </Button>
    </Tooltip>
  );
};
export default GenericChartHeaderButton;
