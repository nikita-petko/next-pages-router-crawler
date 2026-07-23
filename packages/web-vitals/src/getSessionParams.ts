type SessionParams = {
  staticAsset: 'unknown' | 'cached' | 'network';
  serviceWorker: 'unsupported' | 'controlled' | 'uncontrolled';
  pageLoad: 'unknown' | 'cached' | 'network';
};

function serviceWorkerStatus(): SessionParams['serviceWorker'] {
  if (!navigator?.serviceWorker) {
    return 'unsupported';
  }
  if (navigator.serviceWorker.controller) {
    return 'controlled';
  }
  return 'uncontrolled';
}

function staticAssetStatus(): SessionParams['staticAsset'] {
  // check if 0 bytes were transferred for the first next chunk as a proxy for if the static assets are fetched from cache
  const firstScriptTransferSize = performance
    ?.getEntriesByType?.('resource')
    ?.find?.(
      ({ initiatorType, name }) =>
        initiatorType === 'script' && name.includes('_next/static/chunks/'),
    )?.transferSize;

  if (firstScriptTransferSize === undefined) {
    return 'unknown';
  }
  if (firstScriptTransferSize === 0) {
    return 'cached';
  }
  return 'network';
}

function pageLoadStatus(): SessionParams['pageLoad'] {
  // if page is cached, transferSize will be 0 for navigation
  const pageLoadTransferSize = performance?.getEntriesByType?.('navigation')[0]?.transferSize;

  if (pageLoadTransferSize === undefined) {
    return 'unknown';
  }
  if (pageLoadTransferSize === 0) {
    return 'cached';
  }
  return 'network';
}

let memoizedParams: SessionParams | null = null;

export function resetMemoizedParams(): void {
  memoizedParams = null;
}

export function getSessionParams(): SessionParams {
  if (memoizedParams) {
    // calculate once
    return memoizedParams;
  }

  memoizedParams = {
    staticAsset: staticAssetStatus(),
    serviceWorker: serviceWorkerStatus(),
    pageLoad: pageLoadStatus(),
  };

  return memoizedParams;
}
