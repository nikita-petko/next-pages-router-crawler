// Equal-jitter exponential backoff
// see https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
const backOffWithEqualJitter = (base: number, retries: number, power: number, maxDelay: number) => {
  const backoff = Math.min(maxDelay, base * retries ** power);
  return backoff / 2 + (Math.random() * backoff) / 2;
};

export const exponentialBackoffWithJitter = (
  miliseconds: number,
  power: number,
  retries: number,
  maxDelayInMiliseconds: number,
): number => Math.floor(backOffWithEqualJitter(miliseconds, retries, power, maxDelayInMiliseconds));
