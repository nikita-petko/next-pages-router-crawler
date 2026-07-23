import React from 'react';

type VerifiedBadgeIconProps = {
  size?: 'small' | 'medium';
};

export const VerifiedBadgeIcon: React.FC<VerifiedBadgeIconProps> = ({ size = 'small' }) => {
  const px = size === 'medium' ? 16 : 13;

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={px}
      height={px}
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden>
      <path
        d='M3.85948 2.24011C4.00217 1.70759 4.54953 1.39157 5.08205 1.53426L13.7599 3.85948C14.2924 4.00217 14.6084 4.54953 14.4657 5.08205L12.1405 13.7599C11.9978 14.2924 11.4505 14.6084 10.918 14.4657L2.24011 12.1405C1.70759 11.9978 1.39157 11.4505 1.53426 10.918L3.85948 2.24011Z'
        fill='#335FFF'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M11.0303 5.96967C11.3232 6.26256 11.3232 6.73744 11.0303 7.03033L7.53033 10.5303C7.23744 10.8232 6.76256 10.8232 6.46967 10.5303L4.96967 9.03033C4.67678 8.73744 4.67678 8.26256 4.96967 7.96967C5.26256 7.67678 5.73744 7.67678 6.03033 7.96967L7 8.93934L9.96967 5.96967C10.2626 5.67678 10.7374 5.67678 11.0303 5.96967Z'
        fill='#F7F7F8'
      />
    </svg>
  );
};

export default VerifiedBadgeIcon;
