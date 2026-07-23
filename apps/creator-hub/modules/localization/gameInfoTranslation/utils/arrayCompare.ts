// determine if two array are exactly the same
function arrayCompare<T>(compareFunc: (x: T, y: T) => boolean) {
  const compare: (arr1: T[], arr2: T[]) => boolean = (arr1: T[], arr2: T[]) => {
    const [item1, ...otherItems1] = arr1;
    const [item2, ...otherItems2] = arr2;
    if (typeof item1 === 'undefined' || typeof item2 === 'undefined') {
      return compareFunc(item1, item2);
    }
    return compareFunc(item1, item2) && compare(otherItems1, otherItems2);
  };
  return compare;
}

export default arrayCompare;
