import React, { FunctionComponent } from 'react';
import { RobuxIcon } from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/common/components';
import useInlinePriceWithRobuxIconStyles from './InlinePriceWithRobuxIcon.styles';

type TInlineContentWithIconProps = {
  price: string;
};

const InlinePriceWithRobuxIcon: FunctionComponent<TInlineContentWithIconProps> = ({ price }) => {
  const {
    classes: { iconStyle },
  } = useInlinePriceWithRobuxIconStyles();
  return (
    <Flex alignItems='center' justifyContent='flex-end'>
      <RobuxIcon className={iconStyle} fontSize='small' /> <span>{price}</span>
    </Flex>
  );
};
export default InlinePriceWithRobuxIcon;
