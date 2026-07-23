import React, { useContext, useMemo, type ReactNode } from 'react';
import type { OwnershipPayloadV3 } from '../core';
import {
  DEFAULT_WATERMARK_SOURCE_PRODUCT,
  WatermarkSubjectType,
  type WatermarkEncodeSubject,
} from '../serviceClient';
import { OwnershipContext } from './OwnershipContext';
import OwnershipWatermark, { type OwnershipWatermarkProps } from './OwnershipWatermark';
import { useOwnershipWatermarkEncode } from './useOwnershipWatermarkEncode';

export type OwnershipWatermarkRootProps = {
  /**
   * Owner ROS team id resolved by the host from its ownership source of truth
   * (see `teamOwnershipByMetric`). When `payload` is omitted, this is used to request a
   * server-issued opaque v3 token.
   */
  teamId?: number | null;
  /** Server-issued opaque v3 token to embed. Null explicitly disables this subtree. */
  payload?: OwnershipPayloadV3 | null;
  /** Subject used to mint a token. Defaults to a team subject when `teamId` is provided. */
  subject?: WatermarkEncodeSubject | null;
  /** Override for tests and non-Next consumers. Defaults to the package-owned analytics-it-service encode endpoint. */
  encodeUrl?: string | null;
  /** Source product sent to the encode service. */
  sourceProduct?: string | null;
  /** Optional opacity forwarded to the default `<OwnershipWatermark />` child. */
  opacity?: OwnershipWatermarkProps['opacity'];
  /**
   * Optional children for advanced composition. When omitted, the root renders
   * a default `<OwnershipWatermark />`, which is the common ChartCard slot use.
   */
  children?: ReactNode;
};

type ResolvedOwnershipWatermarkRootProps = {
  payload: OwnershipPayloadV3 | null;
  teamId?: number;
  enabled: boolean;
  opacity?: OwnershipWatermarkProps['opacity'];
  children?: ReactNode;
};

type EncodedOwnershipWatermarkRootProps = {
  subjects: readonly WatermarkEncodeSubject[];
  encodeUrl?: string | null;
  sourceProduct?: string | null;
  teamId?: number;
  opacity?: OwnershipWatermarkProps['opacity'];
  children?: ReactNode;
};

function getSubjectFromProps(
  subject: WatermarkEncodeSubject | null | undefined,
  teamId: number | null | undefined,
): WatermarkEncodeSubject | null {
  if (subject !== undefined) {
    return subject;
  }
  return teamId === null || teamId === undefined
    ? null
    : { type: WatermarkSubjectType.Team, teamId };
}

function getDiagnosticTeamId(
  teamId: number | null | undefined,
  subject: WatermarkEncodeSubject | null,
): number | undefined {
  if (teamId !== null && teamId !== undefined) {
    return teamId;
  }
  const rawTeamId = subject?.type === WatermarkSubjectType.Team ? subject.teamId : undefined;
  if (typeof rawTeamId === 'number') {
    return rawTeamId;
  }
  if (typeof rawTeamId !== 'string' || !/^[0-9]+$/u.test(rawTeamId)) {
    return undefined;
  }
  const parsed = Number(rawTeamId);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

function getEncodeSubjects(
  subject: WatermarkEncodeSubject,
  teamId: number | undefined,
): readonly WatermarkEncodeSubject[] {
  // A query subject is a self-contained schema v2 token, including team ownership when known.
  if (subject.type === WatermarkSubjectType.Query) {
    return [subject];
  }

  const subjects: WatermarkEncodeSubject[] = [subject];
  if (subject.type !== WatermarkSubjectType.Team && teamId !== undefined) {
    subjects.push({
      type: WatermarkSubjectType.Team,
      teamId,
    });
  }

  return subjects;
}

const ResolvedOwnershipWatermarkRoot: React.FC<ResolvedOwnershipWatermarkRootProps> = ({
  payload,
  teamId,
  enabled,
  opacity,
  children,
}) => {
  const value = useMemo(
    () => ({
      payload,
      teamId,
      enabled,
    }),
    [enabled, payload, teamId],
  );

  return (
    <OwnershipContext.Provider value={value}>
      {children ?? <OwnershipWatermark opacity={opacity} />}
    </OwnershipContext.Provider>
  );
};

const EncodedOwnershipWatermarkRoot: React.FC<EncodedOwnershipWatermarkRootProps> = ({
  subjects,
  encodeUrl,
  sourceProduct = DEFAULT_WATERMARK_SOURCE_PRODUCT,
  teamId,
  opacity,
  children,
}) => {
  const { data: encodedPayload } = useOwnershipWatermarkEncode({
    subjects,
    encodeUrl,
    sourceProduct,
  });

  if (!encodedPayload) {
    return (
      <ResolvedOwnershipWatermarkRoot
        payload={null}
        teamId={teamId}
        enabled={false}
        opacity={opacity}>
        {children}
      </ResolvedOwnershipWatermarkRoot>
    );
  }

  return (
    <ResolvedOwnershipWatermarkRoot
      payload={encodedPayload}
      teamId={teamId}
      enabled
      opacity={opacity}>
      {children}
    </ResolvedOwnershipWatermarkRoot>
  );
};

const OwnershipWatermarkRoot: React.FC<OwnershipWatermarkRootProps> = ({
  teamId,
  payload,
  subject,
  encodeUrl,
  sourceProduct = DEFAULT_WATERMARK_SOURCE_PRODUCT,
  opacity,
  children,
}) => {
  const parent = useContext(OwnershipContext);
  const localSubject = getSubjectFromProps(subject, teamId);
  const diagnosticTeamId = getDiagnosticTeamId(teamId, localSubject) ?? parent?.teamId;

  if (payload === null) {
    return (
      <ResolvedOwnershipWatermarkRoot
        payload={null}
        teamId={diagnosticTeamId}
        enabled={false}
        opacity={opacity}>
        {children}
      </ResolvedOwnershipWatermarkRoot>
    );
  }

  if (payload !== undefined) {
    return (
      <ResolvedOwnershipWatermarkRoot
        payload={payload}
        teamId={diagnosticTeamId}
        enabled
        opacity={opacity}>
        {children}
      </ResolvedOwnershipWatermarkRoot>
    );
  }

  if (localSubject) {
    return (
      <EncodedOwnershipWatermarkRoot
        subjects={getEncodeSubjects(localSubject, diagnosticTeamId)}
        encodeUrl={encodeUrl}
        sourceProduct={sourceProduct}
        teamId={diagnosticTeamId}
        opacity={opacity}>
        {children}
      </EncodedOwnershipWatermarkRoot>
    );
  }

  const inheritedPayload = parent?.payload ?? null;
  if (inheritedPayload === null) {
    return children ? <>{children}</> : null;
  }

  return (
    <ResolvedOwnershipWatermarkRoot
      payload={inheritedPayload}
      teamId={diagnosticTeamId}
      enabled={parent?.enabled ?? true}
      opacity={opacity}>
      {children}
    </ResolvedOwnershipWatermarkRoot>
  );
};

export default OwnershipWatermarkRoot;
