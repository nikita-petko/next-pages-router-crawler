import type { FunctionComponent, PropsWithChildren } from 'react';

export type TaxesPageStateContext = 'taxCenter' | 'taxbit';

const MAX_WIDTH_BY_CONTEXT: Record<TaxesPageStateContext, number> = {
  taxCenter: 628,
  taxbit: 536,
};

type TaxesPageStateLayoutProps = PropsWithChildren<{
  context?: TaxesPageStateContext;
}>;

const TaxesPageStateLayout: FunctionComponent<TaxesPageStateLayoutProps> = ({
  children,
  context = 'taxCenter',
}) => (
  <div className='flex flex-col items-center justify-center width-full grow min-height-[640px] padding-large'>
    <div
      className='flex flex-col items-center width-full gap-large'
      style={{ maxWidth: MAX_WIDTH_BY_CONTEXT[context] }}>
      {children}
    </div>
  </div>
);

export default TaxesPageStateLayout;
