import { withTranslation } from '@rbx/intl';
import React, { FC } from 'react';

/**
 * Right now this is a simple wrapper for withTranslation.
 * It will soon be updated to handle the namespace switching behavior.
 */
export default function withNamespaceSwitchedTranslation<TProps>(
  WrappedComponent: FC<TProps & React.JSX.IntrinsicAttributes>,
  namespaces: string[],
) {
  type T = TProps & React.JSX.IntrinsicAttributes;

  /**
   * What withTranslation essentially does is set the order of namespaces that are available;
   * Calling it here ensures continuity with the prior behavior.
   */
  return withTranslation<T>(WrappedComponent, namespaces);
}
