import { TTheme } from '@rbx/ui';
import { PrismTheme } from 'prism-react-renderer';

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
