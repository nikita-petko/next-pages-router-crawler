import React, { FunctionComponent } from 'react';
import { InfoOutlinedIcon, TIconProps, Tooltip, TTableCellProps } from '@rbx/ui';
import { components } from '@modules/miscellaneous/common';
import useGenericTableCellWithTooltipStyles from './GenericCellContentWithTooltip.styles';
import cellAlignmentToJustifyContent from './cells/cellAlignmentToJustifyContent';

type TGenericTableCellWithTooltipProps = {
  content: string;
  tooltip?: string;
  Icon?: React.FunctionComponent<React.PropsWithChildren<TIconProps>>;
  align?: TTableCellProps['align'];
};
const { Flex } = components;
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
