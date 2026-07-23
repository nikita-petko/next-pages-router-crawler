import type { FunctionComponent, ReactNode } from 'react';
import { Grid, makeStyles } from '@rbx/ui';
import { ContentLicensingCustomSettingsProvider } from '@modules/ip/common/implementations/contentLicensingCustomSettings';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';

interface IPContainerProps {
  children: ReactNode;
  className?: string;
  spacing?: number;
  direction?: 'column' | 'row';
}

const useStyles = makeStyles()((theme) => ({
  root: {
    [theme.breakpoints.up('XXLarge')]: {
      paddingTop: 24,
    },
  },
}));

/**
 * A reusable container component for IP-related pages that provides consistent styling
 * and XXLarge breakpoint behavior across all IP modules.
 */
const IPContainer: FunctionComponent<IPContainerProps> = ({
  children,
  className,
  spacing = 1,
  direction = 'column',
}) => {
  const { classes } = useStyles();

  return (
    <ContentLicensingCustomSettingsProvider>
      <ToolboxServiceApiProvider>
        <Grid
          container
          flexDirection={direction}
          spacing={spacing}
          className={`${classes.root} ${className ?? ''}`}>
          {children}
        </Grid>
      </ToolboxServiceApiProvider>
    </ContentLicensingCustomSettingsProvider>
  );
};

export default IPContainer;
