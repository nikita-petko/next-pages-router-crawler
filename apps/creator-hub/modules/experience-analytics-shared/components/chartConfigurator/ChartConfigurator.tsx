import type { FC, ReactNode } from 'react';
import ChartConfiguratorSidebar, {
  type ChartConfiguratorSidebarProps,
} from './ChartConfiguratorSidebar';

type RenderSidebarArgs = {
  readonly sidebar: ReactNode;
  readonly sidebarProps: ChartConfiguratorSidebarProps;
};

type ChartConfiguratorProps = {
  readonly sidebarProps: ChartConfiguratorSidebarProps;
  readonly preview: ReactNode;
  readonly headerSlot?: ReactNode;
  readonly actionSlot?: ReactNode;
  readonly topBarSlot?: ReactNode;
  readonly className?: string;
  readonly contentClassName?: string;
  readonly previewClassName?: string;
  readonly renderSidebar?: (args: RenderSidebarArgs) => ReactNode;
};

const ChartConfigurator: FC<ChartConfiguratorProps> = ({
  sidebarProps,
  preview,
  headerSlot,
  actionSlot,
  topBarSlot,
  className,
  contentClassName,
  previewClassName,
  renderSidebar,
}) => {
  const sidebar = <ChartConfiguratorSidebar {...sidebarProps} />;
  return (
    <section className={`flex flex-col min-width-0 width-full ${className ?? ''}`}>
      {(headerSlot !== undefined || actionSlot !== undefined) && (
        <div className='flex flex-row flex-wrap items-center justify-between gap-medium padding-bottom-medium'>
          {headerSlot}
          {actionSlot}
        </div>
      )}
      <div
        className={`flex flex-row items-stretch min-width-0 width-full ${contentClassName ?? ''}`}>
        {renderSidebar ? renderSidebar({ sidebar, sidebarProps }) : sidebar}
        <div className={`flex flex-col flex-1 min-width-0 ${previewClassName ?? ''}`}>
          {topBarSlot}
          {preview}
        </div>
      </div>
    </section>
  );
};

export default ChartConfigurator;
