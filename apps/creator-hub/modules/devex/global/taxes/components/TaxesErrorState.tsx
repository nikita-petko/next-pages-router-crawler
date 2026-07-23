import type { FunctionComponent } from 'react';
import { Button, Icon } from '@rbx/foundation-ui';
import TaxesPageStateLayout, { type TaxesPageStateContext } from './TaxesPageStateLayout';

type TaxesErrorStateProps = {
  context?: TaxesPageStateContext;
  message: string;
  retryLabel: string;
  onRetry: () => void;
};

const TaxesErrorState: FunctionComponent<TaxesErrorStateProps> = ({
  context,
  message,
  retryLabel,
  onRetry,
}) => (
  <TaxesPageStateLayout context={context}>
    <Icon
      name='icon-regular-two-arrows-spin-clockwise'
      size='XLarge'
      className='content-emphasis'
      style={{ height: 48, width: 48 }}
    />
    <p
      className='text-body-large content-default text-align-x-center margin-none width-full'
      role='alert'>
      {message}
    </p>
    <Button variant='Standard' size='Large' onClick={onRetry} style={{ minWidth: 168 }}>
      {retryLabel}
    </Button>
  </TaxesPageStateLayout>
);

export default TaxesErrorState;
