import type { FunctionComponent } from 'react';
import React, { useEffect, useMemo, useRef } from 'react';
import type Aegis from 'aegis-web-sdk';
import { StatusCodes } from '@rbx/core';
import { useAuthentication } from '@modules/authentication/providers';
import excludeUrlsForLuobu from '../constants/excludeUrlsForLuobu';
import type { MetricsMonitoringInterface } from '../contexts/MetricsMonitoringContext';
import MetricsMonitoringContext from '../contexts/MetricsMonitoringContext';

/**
 * App performance monitor for Luobu
 * https://cloud.tencent.com/product/rum/details
 */
const MetricsMonitoringProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const { user } = useAuthentication();
  const aegis = useRef<Aegis | null>(typeof window === 'undefined' ? null : window.aegis);

  useEffect(() => {
    if (aegis.current) {
      aegis.current.setConfig({
        beforeReport(log: { level: string; msg: string }) {
          return !(
            log.msg && excludeUrlsForLuobu.some((excludeUrl) => log.msg.includes(excludeUrl))
          );
        },
        api: {
          // https://cloud.tencent.com/document/product/1464/58560#api.retcodehandler.3Ca-id.3D.22exp1.22.3E.3C.2Fa.3E
          retCodeHandler(data: string, url: string, response: Response) {
            const statusCodeError = !(
              (response.status === StatusCodes.FORBIDDEN && response.headers.has('x-csrf-token')) ||
              response.status === StatusCodes.OK ||
              response.status === StatusCodes.ACCEPTED
            );
            let code: string | number = 'unknown';
            try {
              const parsedData = JSON.parse(data);
              // BDEV1
              if (parsedData.errors && parsedData.errors.length > 0) {
                code = parsedData.errors[0].code;
              }
              // BDEV2 is currently not having standard return code
            } catch {
              code = 'unknown';
            }
            return {
              isErr: statusCodeError && code !== 0,
              retCode: code,
            };
          },
        },
        uin: user?.id,
      });
    }
  }, [user, aegis]);

  function handleException<TParams extends unknown[] = unknown[]>(
    metricsMonitoring: ((...params: TParams) => void) | undefined,
  ) {
    return (...args: TParams) => {
      try {
        metricsMonitoring?.(...args);
      } catch (e) {
        console.error(e);
      }
    };
  }

  const metricsMonitoring: MetricsMonitoringInterface = useMemo(() => {
    return process.env.buildTarget === 'luobu' && aegis.current !== null
      ? {
          info: (message: string) => handleException(aegis.current?.info)(message),
          error: (message: string) => handleException(aegis.current?.error)(message),
          captureError: (error: Error) =>
            handleException(aegis.current?.error)(
              `(Capture Error): [${error.name}]${error.message}`,
            ),
          reportEvent: (name: string) => handleException(aegis.current?.reportEvent)(name),
        }
      : {
          info: () => {
            // placeholder for `into`
          },
          error: () => {
            // placeholder for `error`
          },
          captureError: () => {
            // placeholder for `captureError`
          },
          reportEvent: () => {
            // placeholder for `reportEvent`
          },
        };
  }, [aegis]);

  return (
    <MetricsMonitoringContext.Provider value={metricsMonitoring}>
      {children}
    </MetricsMonitoringContext.Provider>
  );
};

export default MetricsMonitoringProvider;
