import React, { FunctionComponent } from 'react';

import { Button, TButtonProps } from '@rbx/foundation-ui';
import { FormattedText } from '@modules/analytics-translations';

export type AnalyticsPageActionProps = {
  text: FormattedText;
} & TButtonProps;

export const AnalyticsPageAction: FunctionComponent<AnalyticsPageActionProps> = ({
  text,
  ...props
}) => {
  return <Button {...props}>{text}</Button>;
};
