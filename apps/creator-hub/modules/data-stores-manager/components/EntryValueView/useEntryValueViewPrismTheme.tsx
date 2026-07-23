import type { PrismTheme } from 'prism-react-renderer';
import type { TTheme } from '@rbx/ui';

const useEntryValueViewPrismTheme = (theme: TTheme): PrismTheme => {
  const isDarkTheme = theme.palette.mode === 'dark';
  return {
    plain: {},
    // These colours are identical to the ones from creator-analytics to remain consistent.
    styles: [
      {
        types: ['string', 'char'],
        style: {
          color: isDarkTheme ? '#ADF195' : '#68a653',
        },
      },
      {
        types: ['number', 'boolean'],
        style: {
          color: isDarkTheme ? '#ADF195' : '#68a653',
        },
      },
    ],
  };
};

export default useEntryValueViewPrismTheme;
