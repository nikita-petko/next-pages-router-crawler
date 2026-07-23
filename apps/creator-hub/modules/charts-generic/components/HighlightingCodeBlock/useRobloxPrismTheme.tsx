import type { PrismTheme } from 'prism-react-renderer';
import type { TTheme } from '@rbx/ui';

const useRobloxPrismTheme = (theme: TTheme): PrismTheme => ({
  plain: {
    color: theme.palette.content.standard,
  },
  styles: [
    {
      types: ['string', 'char'],
      style: {
        color: '#3C64FA',
      },
    },
    {
      types: ['number', 'boolean'],
      style: {
        color: '#DA40FC',
      },
    },
  ],
});

export default useRobloxPrismTheme;
