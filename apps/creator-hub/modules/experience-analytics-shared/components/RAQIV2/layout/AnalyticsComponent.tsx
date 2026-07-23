import React from 'react';
import RAQIV2PredefinedControlledSubcontext from '../subcontext/RAQIV2PredefinedControlledSubcontext';
import RecursiveAnalyticsComponent, {
  type RecursiveAnalyticsComponentProps,
} from './RecursiveAnalyticsComponent';

export type AnalyticsComponentProps = Omit<RecursiveAnalyticsComponentProps, 'subcontextComponent'>;

const AnalyticsComponent: React.FC<AnalyticsComponentProps> = (props) => (
  <RecursiveAnalyticsComponent
    {...props}
    subcontextComponent={RAQIV2PredefinedControlledSubcontext}
  />
);

export default AnalyticsComponent;
