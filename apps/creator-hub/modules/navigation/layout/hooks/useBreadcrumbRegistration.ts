import { useEffect } from 'react';
import { useBreadcrumbRegister } from '../contexts/BreadcrumbItemNameContext';
import type BreadcrumbItemType from '../enums/BreadcrumbsItemType';

export default function useBreadcrumbRegistration(
  type: BreadcrumbItemType,
  name: string | undefined,
) {
  const context = useBreadcrumbRegister();

  useEffect(() => {
    if (!context) {
      return undefined;
    }

    context.register(type, name);
    return () => {
      context.unregister(type);
    };
  }, [context, type, name]);
}
