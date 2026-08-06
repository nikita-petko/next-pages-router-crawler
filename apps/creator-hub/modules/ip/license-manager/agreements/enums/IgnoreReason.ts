/**
 * Reasons an IP holder can ignore an agreement candidate.
 *
 * The string values are sent as-is in the ignore request body and MUST stay identical to the
 * content-licensing `AgreementCandidateArchiveReason` enum names: the ignore endpoint parses the
 * reason with `Enum.TryParse` and rejects anything that isn't a case-sensitive match to one of
 * these ignore members.
 */
enum IgnoreReason {
  IgnoredNotInterested = 'IgnoredNotInterested',
  IgnoredDoesNotUseMyIp = 'IgnoredDoesNotUseMyIp',
}

/** Runtime guard so string inputs (e.g. radio values) can be narrowed to IgnoreReason safely. */
export const isIgnoreReason = (value: string): value is IgnoreReason =>
  (Object.values(IgnoreReason) as string[]).includes(value);

export default IgnoreReason;
