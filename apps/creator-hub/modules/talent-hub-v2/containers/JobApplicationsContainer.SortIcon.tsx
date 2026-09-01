import React from 'react';
import { ARROW_DOWN_PATH, ARROW_UP_PATH, type SortDir } from './JobApplicationsContainer.helpers';
import styles from '../components/shared/Layout.module.css';

export const SortIcon: React.FC<{ active?: boolean; direction: SortDir }> = () => (
  <svg
    width='16'
    height='16'
    viewBox='0 0 20 20'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    aria-hidden='true'
    className={styles.sortIconInactive}>
    <path d={ARROW_UP_PATH} fill='currentColor' />
    <path d={ARROW_DOWN_PATH} fill='currentColor' />
  </svg>
);
