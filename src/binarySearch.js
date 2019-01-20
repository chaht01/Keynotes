function binarySearch(list, value, cmp) {
  // initial values for start, middle and end
  let start = 0;
  let stop = list.length - 1;
  let middle = Math.floor((start + stop) / 2);

  // While the middle is not what we're looking for and the list does not have a single item
  let eq = cmp(list[middle], value);
  while (eq !== 0 && start < stop) {
    if (eq < 0) {
      stop = middle - 1;
    } else {
      start = middle + 1;
    }

    // recalculate middle on every iteration
    middle = Math.floor((start + stop) / 2);
    eq = cmp(list[middle], value);
  }

  // if the current middle item is what we're looking for return it's index, else return -1
  return cmp(list[middle], value) !== 0 ? -1 : middle;
}

module.exports = binarySearch;
