import type { FunctionComponent } from 'react';
import React from 'react';
import type { TIconProps, TTableCellProps } from '@rbx/ui';
import { InfoOutlinedIcon, Tooltip } from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/components';
import cellAlignmentToJustifyContent from './cells/cellAlignmentToJustifyContent';
import useGenericTableCellWithTooltipStyles from './GenericCellContentWithTooltip.styles';

type TGenericTableCellWithTooltipProps = {
  content: string;
  tooltip?: string;
  Icon?: React.FunctionComponent<React.PropsWithChildren<TIconProps>>;
  align?: TTableCellProps['align'];
};

const GenericCellContentWithTooltip: FunctionComponent<TGenericTableCellWithTooltipProps> = ({
  content,
  tooltip,
  Icon = InfoOutlinedIcon,
  align = 'inherit',
}) => {
  const {
    classes: { tooltipContentStyle, tooltipIcon },
  } = useGenericTableCellWithTooltipStyles();

  return (
    <Flex justifyContent={cellAlignmentToJustifyContent(align)}>
      <span className={tooltipContentStyle}>{content}</span>
      {tooltip ? (
        <Tooltip title={tooltip} placement='right' enterTouchDelay={0} leaveTouchDelay={3000}>
          <span className={tooltipIcon}>
            <Icon fontSize='small' />
          </span>
        </Tooltip>
      ) : null}
    </Flex>
  );
};
export default GenericCellContentWithTooltip;
