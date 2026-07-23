import type { PropsWithChildren } from 'react';
import { forwardRef } from 'react';
import { makeStyles } from '@rbx/ui';
import { snakeToPascalCase } from '../utils/helperUtils';

const useStyles = makeStyles<{ gap: number }>()((_, { gap }) => ({
  gap: {
    gap,
  },
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
  flexDirectionRowReverse: {
    flexDirection: 'row-reverse',
  },
  flexDirectionColumn: {
    flexDirection: 'column',
  },

  flexDirectionColumnReverse: {
    flexDirection: 'column-reverse',
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
}));

type TFlexProps = {
  id?: string;
  className?: string;
  classes?: Partial<{ root: string }>;
  flexDirection?: 'column' | 'row' | 'row-reverse' | 'column-reverse';
  flexWrap?: 'wrap' | 'wrap-reverse' | 'nowrap';
  gap?: number;
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch';
};

export const Flex = forwardRef<HTMLDivElement, PropsWithChildren<TFlexProps>>(
  (
    {
      id,
      className,
      classes,
      flexDirection,
      flexWrap,
      justifyContent,
      alignItems,
      gap = 0,
      children,
    },
    ref,
  ) => {
    const {
      classes: { flex, ...styles },

      cx,
    } = useStyles({ gap });
    return (
      <div
        ref={ref}
        id={id}
        className={cx(
          flex,
          styles.gap,
          className,
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
