import { ReactNode } from 'react';

interface CustomTabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

const CustomTabPanel = ({ children, index, value, ...other }: CustomTabPanelProps) => (
  <div hidden={value !== index} role='tabpanel' {...other}>
    {children}
  </div>
);

export default CustomTabPanel;
