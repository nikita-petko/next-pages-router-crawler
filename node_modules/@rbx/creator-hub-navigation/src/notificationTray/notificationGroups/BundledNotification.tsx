import type { FunctionComponent } from 'react';
import React, { useState, useRef, useEffect } from 'react';
import { Grid, Typography } from '@rbx/ui';
import type TNotificationGroup from '../types/TNotificationGroup';
import useNotificationBundleStyles from './BundledNotification.styles';
import Notification from './NotificationV2';

type TBundledNotificationProps = {
  notificationGroup: TNotificationGroup;
  notificationGroupIndex: number;
  markReadStatus: (notificationId: string, readStatus: boolean) => void;
};

const BundledNotification: FunctionComponent<TBundledNotificationProps> = ({
  notificationGroup,
  notificationGroupIndex,
  markReadStatus,
}) => {
  const { classes: styles } = useNotificationBundleStyles();
  const [expanded, setExpanded] = useState<boolean>(false);
  const notificationsContainer = useRef<HTMLDivElement>(null);
  const [notificationsContainerHeight, setNotificationsContainerHeight] = useState(0);

  useEffect(() => {
    setNotificationsContainerHeight(notificationsContainer.current?.offsetHeight || 0);
    if (notificationsContainer.current) {
      notificationsContainer.current.style.height = '0px';
      notificationsContainer.current.style.transition = 'all 500ms';
    }
  }, []);

  const expandBundle = () => {
    setExpanded(!expanded);
    if (notificationsContainer.current) {
      notificationsContainer.current.style.height = expanded
        ? '0px'
        : `${notificationsContainerHeight}px`;
    }
  };

  if (notificationGroup.children.length === 0) {
    return (
      <Notification
        markReadStatus={markReadStatus}
        enableNotificationsM2={false}
        notificationGroupIndex={notificationGroupIndex}
        notificationContent={notificationGroup.titleNotification}
      />
    );
  }

  return (
    <Grid className={styles.container}>
      <div className={`${styles.bundleLabel} ${expanded ? '' : styles.hidden}`}>
        <Typography variant='footer'>Bundle</Typography>
        <Typography variant='footer' color='info' onClick={expandBundle}>
          Show Less
        </Typography>
      </div>
      <Grid
        onClick={() => {
          if (!expanded) {
            expandBundle();
          }
          if (!notificationGroup.titleNotification.read) {
            markReadStatus(notificationGroup.titleNotification.notificationId, true);
          }
        }}
        className={`${styles.rootNotif} ${expanded ? styles.paddingBottom : ''}`}>
        <Notification
          enableNotificationsM2={false}
          notificationContent={notificationGroup.titleNotification}
        />
        <div className={`${styles.bundleDecorationContainer} ${expanded ? styles.hidden : ''}`}>
          <div className={styles.decorationTop} />
          {notificationGroup.children.length > 1 && <div className={styles.decorationBottom} />}
        </div>
      </Grid>
      <div ref={notificationsContainer}>
        {notificationGroup.children.map((item, index: number) => {
          return (
            <div
              key={item.notificationId}
              className={`${styles.bundleDecorationContainer} ${
                expanded ? '' : styles.notExpanded
              }`}
              style={{
                transform: expanded ? 'translateY(0%)' : `translateY(-${(index + 1) * 110}%)`,
                zIndex: -index - 1,
              }}>
              <Notification enableNotificationsM2={false} notificationContent={item} />
            </div>
          );
        })}
      </div>
    </Grid>
  );
};

export default BundledNotification;
