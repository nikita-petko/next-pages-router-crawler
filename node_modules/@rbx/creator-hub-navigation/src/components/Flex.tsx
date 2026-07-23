// (NOTE @mbae, 02/16/24): This is duplicated code. See CRF-4891.
import type { PropsWithChildren } from 'react';
import React, { forwardRef } from 'react';
import { makeStyles } from '@rbx/ui';
import snakeToPascalCase from '../utils/snakeToPascalCase';

const useStyles = makeStyles()({
  flex: {
    display: 'flex',
  },
  justifyContentCenter: {
    justifyContent: 'center',
  },
  justifyContentFlexStart: {
    justifyContent: 'flex-start',
  },
  justifyContentFlexEnd: {
    justifyContent: 'flex-end',
  },
  justifyContentSpaceBetween: {
    justifyContent: 'space-between',
  },
  justifyContentSpaceAround: {
    justifyContent: 'space-around',
  },
  justifyContentSpaceEvenly: {
    justifyContent: 'space-evenly',
  },
  alignItemsCenter: {
    alignItems: 'center',
  },
  alignItemsFlexStart: {
    alignItems: 'flex-start',
  },
  alignItemsFlexEnd: {
    alignItems: 'flex-end',
  },
  flexDirectionRow: {
    flexDirection: 'row',
  },
  flexDirectionColumn: {
    flexDirection: 'column',
  },
  flexWrapWrap: {
    flexWrap: 'wrap',
  },
  flexWrapWrapReverse: {
    flexWrap: 'wrap-reverse',
  },
  flexWrapNoWrap: {
    flexWrap: 'nowrap',
  },
});

type TFlexProps = {
  classes?: Partial<{ root: string }>;
  flexDirection?: 'column' | 'row';
  flexWrap?: 'wrap' | 'wrap-reverse' | 'nowrap';
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center';
};

export const Flex = forwardRef<HTMLDivElement, PropsWithChildren<TFlexProps>>(
  ({ classes, flexDirection, flexWrap, justifyContent, alignItems, children }, ref) => {
    const {
      classes: { flex, ...styles },

      cx,
    } = useStyles();
    return (
      <div
        ref={ref}
        className={cx(
          flex,
          classes?.root,
          styles[`flexDirection${snakeToPascalCase(flexDirection ?? '')}` as keyof typeof styles],
          styles[`flexWrap${snakeToPascalCase(flexWrap ?? '')}` as keyof typeof styles],
          styles[`alignItems${snakeToPascalCase(alignItems ?? '')}` as keyof typeof styles],
          styles[`justifyContent${snakeToPascalCase(justifyContent ?? '')}` as keyof typeof styles],
        )}>
        {children}
      </div>
    );
  },
);
Flex.displayName = 'Flex';
export default Flex;
