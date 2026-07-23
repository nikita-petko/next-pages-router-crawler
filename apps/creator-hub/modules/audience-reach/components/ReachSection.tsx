import type { FC, ReactNode } from 'react';

interface ReachSectionProps {
  heading: string;
  children: ReactNode;
}

const ReachSection: FC<ReachSectionProps> = ({ heading, children }) => (
  <div className='flex flex-col gap-large'>
    <h3 className='label-large margin-none'>{heading}</h3>
    {children}
  </div>
);

export default ReachSection;
