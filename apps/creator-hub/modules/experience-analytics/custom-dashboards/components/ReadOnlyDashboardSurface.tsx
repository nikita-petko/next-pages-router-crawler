import type { FC, ReactNode } from 'react';
import { RAQIV2ConfigurablePageSurfaceContextProvider } from '@modules/experience-analytics-shared/components/RAQIV2/layout/RAQIV2ConfigurablePageContext';
import type { SynthesizeResult } from '../synthesis/synthesize';
import type { CustomDashboardConfig } from '../types';
import DashboardCanvasControlBar from './DashboardCanvasControlBar';
import DashboardLayoutBody from './DashboardLayoutBody';

type ReadOnlyDashboardSurfaceProps = {
  readonly config: CustomDashboardConfig;
  readonly synthesis: SynthesizeResult;
  /** Surface-specific header (preview banner, view title, etc.). */
  readonly header: ReactNode;
};

/**
 * Shared chrome for the non-editing dashboard surfaces (preview, view): the page
 * surface context provider, a caller-supplied header, the control bar, and the
 * synthesized layout body. Only the header differs between surfaces.
 */
const ReadOnlyDashboardSurface: FC<ReadOnlyDashboardSurfaceProps> = ({
  config,
  synthesis,
  header,
}) => {
  const { pageConfig } = synthesis;
  return (
    <RAQIV2ConfigurablePageSurfaceContextProvider config={pageConfig}>
      <div className='flex flex-col gap-xxlarge width-full'>
        {header}
        <DashboardCanvasControlBar pageConfig={pageConfig} />
        <DashboardLayoutBody config={config} pageConfig={pageConfig} synthesis={synthesis} />
      </div>
    </RAQIV2ConfigurablePageSurfaceContextProvider>
  );
};

export default ReadOnlyDashboardSurface;
