import type { FunctionComponent, ReactNode } from 'react';
import styles from './DevelopmentItemsToolbar.module.css';

export type DevelopmentItemsToolbarProps = {
  actionControl?: ReactNode;
  assetTypeControl: ReactNode;
  filterControl?: ReactNode;
  searchControl: ReactNode;
  viewControl: ReactNode;
};

const DevelopmentItemsToolbar: FunctionComponent<DevelopmentItemsToolbarProps> = ({
  actionControl,
  assetTypeControl,
  filterControl,
  searchControl,
  viewControl,
}) => (
  <div className={styles.container}>
    <div className={styles.toolbar}>
      <div className={styles.search}>{searchControl}</div>
      <div className={styles.assetType}>{assetTypeControl}</div>
      {(actionControl != null || filterControl != null) && (
        <div className={styles.actions}>
          {actionControl}
          {filterControl}
        </div>
      )}
      <div className={styles.view}>{viewControl}</div>
    </div>
  </div>
);

export default DevelopmentItemsToolbar;
