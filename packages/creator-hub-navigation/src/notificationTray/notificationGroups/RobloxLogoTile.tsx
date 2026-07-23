import React from 'react';

const RobloxLogoTile: React.FC<{ size: number }> = ({ size = 48 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 48 48'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'>
      <g clipPath='url(#clip0_430_46)'>
        <path
          d='M40.5 0H7.5C3.35786 0 0 3.35786 0 7.5V40.5C0 44.6421 3.35786 48 7.5 48H40.5C44.6421 48 48 44.6421 48 40.5V7.5C48 3.35786 44.6421 0 40.5 0Z'
          fill='#335FFF'
        />
        <path
          d='M13.6274 6L6 34.4663L34.4663 42.0938L42.0938 13.6274L13.6274 6ZM26.9591 29.0916L19.0046 26.9591L21.1371 19.0046L29.0947 21.1371L26.9591 29.0916Z'
          fill='#F7F7F8'
        />
      </g>
      <defs>
        <clipPath id='clip0_430_46'>
          <rect width='48' height='48' fill='white' />
        </clipPath>
      </defs>
    </svg>
  );
};

export default RobloxLogoTile;
