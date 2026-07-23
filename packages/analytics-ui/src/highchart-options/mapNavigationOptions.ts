import { MapNavigationOptions } from 'highcharts';
import { useMemo } from 'react';

const useMapNavigationOptions = (): MapNavigationOptions => {
  return useMemo(
    () => ({
      enabled: true,
      enableMouseWheelZoom: false,
      buttonOptions: {
        alignTo: 'spacingBox',
        style: {
          fontWeight: 'normal',
        },
      },
    }),
    [],
  );
};

export default useMapNavigationOptions;
