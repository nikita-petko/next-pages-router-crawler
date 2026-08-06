import type { FunctionComponent, ReactNode } from 'react';
import styles from './DevelopmentItemsToolbar.module.css';

export type DevelopmentItemsToolbarProps = {
  assetTypeControl: ReactNode;
  filterControl?: ReactNode;
  searchControl: ReactNode;
  viewControl: ReactNode;
};

const DevelopmentItemsToolbar: FunctionComponent<DevelopmentItemsToolbarProps> = ({
  assetTypeControl,
  filterControl,
  searchControl,
  viewControl,
}) => (
  <div className={styles.container}>
    <div className={styles.toolbar}>
      <div className={styles.search}>{searchControl}</div>
      <div className={styles.assetType}>{assetTypeControl}</div>
      {filterControl != null && <div className={styles.filter}>{filterControl}</div>}
      <div className={styles.view}>{viewControl}</div>
    </div>
  </div>
);

export default DevelopmentItemsToolbar;
