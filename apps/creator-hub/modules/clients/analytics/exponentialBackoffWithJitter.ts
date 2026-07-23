// exponential backoff with an Equal Jitter
// see https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
const backOffWithEqualJitter = (base: number, retries: number, power: number, maxDelay: number) => {
  const backoff = Math.min(maxDelay, base * retries ** power);
  const withEqualJitter = backoff / 2 + (Math.random() * backoff) / 2;
  return withEqualJitter;
};

const exponentialBackoffWithJitter = (
  miliseconds: number,
  power: number,
  retries: number,
  maxDelayInMiliseconds: number,
) => {
  const sleep = backOffWithEqualJitter(miliseconds, retries, power, maxDelayInMiliseconds);
  return Math.floor(sleep);
};

export default exponentialBackoffWithJitter;
