import React, { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useUnsupportedBrowserStyles } from '@modules/miscellaneous/error';

import { ASSET_BASE_PATH } from '../modules/miscellaneous/error/constants/assetConstants';

const getUnsupportedPageLayout = (page: ReactNode) => <React.Fragment>{page}</React.Fragment>;

// Do not use webp or any newer image formats here. Use widely supported image formats.
const supportedBrowsers = [
  {
    label: 'Download Chrome',
    logo: `${ASSET_BASE_PATH}/chrome.png`,
    downloadLink: 'https://www.google.com/chrome/',
  },
  {
    label: 'Download Firefox',
    logo: `${ASSET_BASE_PATH}/firefox.png`,
    downloadLink: 'https://www.mozilla.org/en-US/firefox/new/',
  },
  {
    label: 'Download Edge',
    logo: `${ASSET_BASE_PATH}/edge.png`,
    downloadLink: 'https://www.microsoft.com/en-us/edge',
  },
  {
    label: 'Download Safari',
    logo: `${ASSET_BASE_PATH}/safari.png`,
    downloadLink: 'https://www.apple.com/safari/',
  },
];

// Implementation for this page should be such that the entire page is rendered as HTML from the
// server and does not need a working javascript to be functional. We cannot use context providers
// for localization or theme here.
// Note that this page is not localized. The login page for roblox does not work for most of the
// browsers that are blocked here (ex. IE 11). It is very likely that the user is not logged in for
// these browsers, so the locale would default to en-US.
const UnsupportedPage: NextLayoutPage = () => {
  const { classes } = useUnsupportedBrowserStyles();
  return (
    <div className={classes.wrapper}>
      <div className={classes.aligner}>&nbsp;</div>
      <div className={classes.container}>
        <img src={`${ASSET_BASE_PATH}/unsupported-browser.png`} alt='' height={240} width={319} />
        <h1>Please update your browser</h1>
        <p>
          To continue using Creator Hub, update to the newest version of the following browsers:
        </p>
        <div>
          {supportedBrowsers.map((browser) => (
            <a href={browser.downloadLink} key={browser.label} className={classes.browserLink}>
              <img src={browser.logo} alt={browser.label} height={50} width={50} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

UnsupportedPage.getPageLayout = getUnsupportedPageLayout;

export default UnsupportedPage;
