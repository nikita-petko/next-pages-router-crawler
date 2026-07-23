import React, { FunctionComponent, useCallback, useRef, useState } from 'react';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import SelectedItemDetailContext from '../contexts/SelectedItemDetailContext';
import {
  DescriptionField,
  FieldUpdateEvent,
  FieldUpdateEventCallback,
  IconField,
  NameField,
  ProductFieldIdentifier,
} from '../types';

function identifierToString(identifier: ProductFieldIdentifier) {
  return `${identifier.id}-${identifier.productType}-${identifier.fieldType}`;
}

const SelectedItemDetailProvider: FunctionComponent<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const [selectedItemDetail, setSelectedItemDetail] = useState<
    NameField | DescriptionField | IconField | null
  >(null);
  const { error } = useMetricsMonitoring();
  const eventMap = useRef<Map<string, FieldUpdateEventCallback>>(new Map());
  const addEventListener = useCallback(
    (listener: FieldUpdateEventCallback, identifier: ProductFieldIdentifier) => {
      eventMap.current.set(identifierToString(identifier), listener);
    },
    [],
  );
  const removeEventListener = useCallback(
    (identifier: ProductFieldIdentifier) => eventMap.current.delete(identifierToString(identifier)),
    [eventMap],
  );
  const dispatchEvent = useCallback(
    (event: FieldUpdateEvent) => {
      const listener = eventMap.current.get(
        identifierToString({
          id: event.productId,
          productType: event.productType,
          fieldType: event.fieldType,
        }),
      );
      if (listener) {
        listener(event);
      } else {
        error(
          `[SelectedItemDetailProvider] cannot find proper listener for event ${JSON.stringify(
            event,
          )}`,
        );
      }
    },
    [error],
  );
  return (
    <SelectedItemDetailContext.Provider
      value={{
        itemDetail: selectedItemDetail,
        setSelectedItem: setSelectedItemDetail,
        addEventListener,
        removeEventListener,
        dispatchEvent,
      }}>
      {children}
    </SelectedItemDetailContext.Provider>
  );
};

export default SelectedItemDetailProvider;
