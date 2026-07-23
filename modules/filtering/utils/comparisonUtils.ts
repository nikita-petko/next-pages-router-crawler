const setsEqual = (firstSet: Set<string>, secondSet: Set<string> | undefined) =>
  secondSet !== undefined &&
  firstSet.size === secondSet.size &&
  Array.from(firstSet).every((x) => secondSet.has(x));

export default setsEqual;
