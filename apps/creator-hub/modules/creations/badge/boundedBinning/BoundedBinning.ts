type IdType = number | string;

export interface Orderable {
  id: IdType;
  [key: string]: string | number | boolean;
}

export interface OrderingBin {
  upperBound?: IdType;
  elements: IdType[];
  lowerBound?: IdType;
}

interface BoundedBinning {
  drop: (id: IdType, position: number) => void;
  append: (entry: Orderable) => void;
  Delta: OrderingBin[];
  Current: Orderable[];
  Original: Orderable[];
}

type SourceDirection = 'Above' | 'Below';

// Returns true if the target bin contains the target id as an element or bound.
function binContainsId(targetBin: OrderingBin, id: IdType): boolean {
  const { upperBound, lowerBound, elements } = targetBin;
  return upperBound === id || lowerBound === id || elements.includes(id);
}

// Returns any bins from the target bins that contain the target id as an element or bound.
function getBinsById(bins: OrderingBin[], id: IdType): OrderingBin[] {
  return bins.filter((bin) => binContainsId(bin, id));
}

class Binning implements BoundedBinning {
  // The original order of elements as defined by the source order.
  Original: Orderable[];

  // The current order of elements as elements are reordered.
  Current: Orderable[];

  // The changes table that can be used to transform the Original order to the new Current order.
  Delta: OrderingBin[];

  constructor(config: { sourceOrder: Orderable[] }) {
    if (config.sourceOrder === undefined) {
      throw new Error('Cannot create new binning system without a specified source order.');
    }

    this.Original = config.sourceOrder;
    this.Current = [...this.Original];
    this.Delta = [];
  }

  // Gets the original position of the element with the target id.
  private getOriginalPosition(id: IdType): number | undefined {
    return this.Original.findIndex((item) => item.id === id);
  }

  // Gets the current position of the element with the target id.
  private getCurrentPosition(id: IdType): number | undefined {
    return this.Current.findIndex((item) => item.id === id);
  }

  // Returns true if the target id has not been reordered.
  private hasNotMoved(id: IdType): boolean {
    return !this.Delta.some((bin) => bin.elements.includes(id));
  }

  // Gets the ids of the original elements above and below the element with the target id.
  private getOriginalBoundsById(id: IdType): [IdType | undefined, IdType | undefined] {
    const originalPositionOfElement = this.Original.findIndex((item) => item.id === id);
    if (originalPositionOfElement === undefined) {
      throw new Error(
        'Attempted to get the original bounds of an element not found in the binning system.',
      );
    }

    const upperBound =
      originalPositionOfElement > 0 ? this.Original[originalPositionOfElement - 1].id : undefined;
    const lowerBound =
      originalPositionOfElement < this.Original.length - 1
        ? this.Original[originalPositionOfElement + 1].id
        : undefined;
    return [upperBound, lowerBound];
  }

  // Gets the ids of the elements that would currently be the upper and lower bounds if the element was inserted at the target position.
  // the element being moved is ignored to ensure the correct new bounds are returned.
  private getCurrentBoundsByPosition(
    position: number,
    idToIgnore: IdType,
  ): [IdType | undefined, IdType | undefined] {
    let upperBound: IdType | undefined;
    let lowerBound: IdType | undefined;

    if (position > 0) {
      if (this.Current[position - 1]?.id !== idToIgnore) {
        upperBound = this.Current[position - 1].id;
      } else if (position > 1) {
        upperBound = this.Current[position - 2]?.id;
      }
    }

    if (this.Current[position]?.id !== idToIgnore) {
      lowerBound = this.Current[position]?.id;
    } else if (this.Current[position + 1]) {
      lowerBound = this.Current[position + 1]?.id || undefined;
    }

    return [upperBound, lowerBound];
  }

  // Gets any bins that contain the element at the target position as an element or bound.
  private getBinByPosition(
    bins: OrderingBin[],
    position: number,
    sourceDirection: SourceDirection,
  ): OrderingBin | undefined {
    const orderableAtPosition: Orderable | undefined = this.Current[position];

    if (!orderableAtPosition) {
      return undefined;
    }

    const viableBins: OrderingBin[] = getBinsById(bins, orderableAtPosition.id);

    return viableBins.find(
      (bin) =>
        !(orderableAtPosition.id === bin.upperBound && sourceDirection === 'Below') &&
        !(orderableAtPosition.id === bin.lowerBound && sourceDirection === 'Above'),
    );
  }

  // Removes a target bin from the changes table.
  private destroyBin(targetBin: OrderingBin): void {
    this.Delta = this.Delta.filter((bin) => bin !== targetBin);
  }

  // When reordering elements, it is possible that a bin may become well-ordered and thus no longer needed.
  // This method checks for such cases.
  private isBinNecessary(targetBin: OrderingBin): boolean {
    let lastPosition = targetBin.upperBound
      ? (this.getOriginalPosition(targetBin.upperBound) ?? -1)
      : -1;

    for (const id of targetBin.elements) {
      const elementPosition = this.getOriginalPosition(id);
      if (elementPosition === undefined) {
        throw new Error('Attempted to access an element that is not defined.');
      }

      if (elementPosition < lastPosition) {
        return true;
      }
      lastPosition = elementPosition;
    }

    const lowerBoundOriginalPosition = targetBin.lowerBound
      ? (this.getOriginalPosition(targetBin.lowerBound) ?? this.Original.length)
      : this.Original.length;

    if (lowerBoundOriginalPosition < lastPosition) {
      return true;
    }

    return false;
  }

  // Sometimes a bin can be split into two, more efficient bins. This method checks for such cases and applies the split if applicable.
  private trySplitBin(bin: OrderingBin): void {
    const binToUpdate: OrderingBin = bin;

    let originalPositionOfBinsUpperBound = binToUpdate.upperBound
      ? (this.getOriginalPosition(binToUpdate.upperBound) ?? -1)
      : -1;

    const originalPositionOfBinsLowerBound = binToUpdate.lowerBound
      ? (this.getOriginalPosition(binToUpdate.lowerBound) ?? this.Original.length)
      : this.Original.length;

    const sourceElements = [...binToUpdate.elements];
    let lowerThreshold = 0;

    for (let i = 0; i < sourceElements.length; i += 1) {
      const originalPositionOfElement = this.getOriginalPosition(sourceElements[i]);
      let iterationCompleted = false;

      if (originalPositionOfElement === undefined) {
        throw new Error('Attempted to access an element that is not defined.');
      }

      if (
        originalPositionOfElement > originalPositionOfBinsUpperBound &&
        originalPositionOfElement < originalPositionOfBinsLowerBound
      ) {
        if (i === 0 && binToUpdate.upperBound) {
          let canOpportunisticallyRebound = true;

          for (const checkId of sourceElements) {
            const originalPositionOfCheckId = this.getOriginalPosition(checkId);

            if (originalPositionOfCheckId === undefined) {
              throw new Error(
                'Attempted to get the position of an element that is not found in the binning system.',
              );
            }

            if (originalPositionOfCheckId < originalPositionOfElement) {
              canOpportunisticallyRebound = false;
              break;
            }
          }

          if (canOpportunisticallyRebound) {
            binToUpdate.upperBound = sourceElements[i];
            originalPositionOfBinsUpperBound = originalPositionOfElement;
            bin.elements.shift();
            lowerThreshold += 1;
            iterationCompleted = true;
          }
        } else if (i === sourceElements.length - 1 && bin.lowerBound) {
          let canOpportunisticallyRebound = true;

          for (const checkId of sourceElements) {
            const originalPositionOfCheckId = this.getOriginalPosition(checkId);

            if (originalPositionOfCheckId === undefined) {
              throw new Error(
                'Attempted to get the position of an element that is not found in the binning system.',
              );
            }

            if (originalPositionOfCheckId > originalPositionOfElement) {
              canOpportunisticallyRebound = false;
              break;
            }
          }

          if (canOpportunisticallyRebound) {
            binToUpdate.lowerBound = sourceElements[i];
            binToUpdate.elements.splice(i, 1);
            iterationCompleted = true;
          }
        }

        if (!iterationCompleted && i > lowerThreshold && i < sourceElements.length - 1) {
          const oldBinsUpdatedContents = sourceElements.slice(lowerThreshold, i);
          const newBinsContents = sourceElements.slice(i + 1);

          const newBin: OrderingBin = {
            upperBound: sourceElements[i],
            elements: newBinsContents,
            lowerBound: binToUpdate.lowerBound,
          };

          binToUpdate.lowerBound = sourceElements[i];
          binToUpdate.elements = oldBinsUpdatedContents;

          if (this.isBinNecessary(newBin)) {
            this.Delta.push(newBin);
          }

          break;
        }
      }
    }

    if (!this.isBinNecessary(bin) || bin.elements.length === 0) {
      this.destroyBin(bin);
    }
  }

  // When removing an element from a bin, if the element was a bound of the bin, it may be necessary for us to determine
  // and set a new bound for the bin. This method handles such cases.
  private rebound(
    bin: OrderingBin,
    boundType: 'Upper' | 'Lower',
    removingId: string | number,
  ): OrderingBin {
    const updatedBin: OrderingBin = bin;

    // If we are replacing the upper bound, we need to check elements higher in the list until we find a viable new upper bound.
    if (boundType === 'Upper') {
      const currentIndex =
        updatedBin.upperBound !== undefined
          ? this.getCurrentPosition(updatedBin.upperBound)
          : undefined;

      if (currentIndex === undefined) {
        throw new Error('Cannot rebound upper a bin without an upper bound.');
      }

      for (let i = currentIndex - 1; i >= -1; i -= 1) {
        let nextBoundId: IdType | undefined;

        const candidateId = this.Current[i]?.id || undefined;
        if (candidateId) {
          const binCheckCandidates = getBinsById(this.Delta, candidateId);

          // The next id to check should be either a constant, or the lower bound of the next bin neighboring this bin.
          // If it is the lower bound of a bin, it may be the id of the element we are removing.
          // In such a case, we should use the last element in the next bin's elements array instead of the lower bound.
          if (binCheckCandidates && binCheckCandidates.length > 0) {
            let overrodeNextBoundId = false;
            for (const binToCheck of binCheckCandidates) {
              if (binToCheck !== updatedBin) {
                const lowerBoundValue =
                  binToCheck.lowerBound !== removingId
                    ? binToCheck.lowerBound
                    : binToCheck.elements[binToCheck.elements.length - 1];
                if (lowerBoundValue !== updatedBin.upperBound) {
                  nextBoundId = lowerBoundValue;
                  overrodeNextBoundId = true;
                  break;
                }
              }
            }

            if (!overrodeNextBoundId) {
              nextBoundId = candidateId;
            }
          } else {
            nextBoundId = candidateId;
          }
        }

        if (nextBoundId) {
          // The candidate for this bin's new upper bound is a static (umoved) element.
          if (this.hasNotMoved(nextBoundId)) {
            const [consumeMemberUpperBound] = this.getOriginalBoundsById(updatedBin.elements[0]);
            // If the candidate was the original upper bound of the first element in this bin, we can instead consume
            // the first member of this bin as the upper bound.
            if (consumeMemberUpperBound === nextBoundId) {
              const targetIndex = 0;
              updatedBin.upperBound = updatedBin.elements[targetIndex];
              updatedBin.elements.shift();
              return updatedBin;
            }

            updatedBin.upperBound = nextBoundId;

            // The candidate for this bin's new upper bound is a member element of another bin.
            // We should attempt to merge the two bins.
          } else {
            const binsToMergeCandidates = getBinsById(this.Delta, nextBoundId);

            if (!binsToMergeCandidates) {
              throw new Error(
                'Invalid delta state detected: The next candidate for an upper bound has been re-ordered, but is not in a bin.',
              );
            }

            for (const binToMerge of binsToMergeCandidates) {
              const lowerBoundValue =
                binToMerge.lowerBound !== removingId
                  ? binToMerge.lowerBound
                  : binToMerge.elements[binToMerge.elements.length - 1];
              if (
                lowerBoundValue === updatedBin.upperBound ||
                updatedBin.upperBound === removingId
              ) {
                for (
                  let elementIndex = binToMerge.elements.length - 1;
                  elementIndex >= 0;
                  elementIndex -= 1
                ) {
                  const elementId = binToMerge.elements[elementIndex];
                  updatedBin.elements.unshift(elementId);
                }

                updatedBin.upperBound = binToMerge.upperBound;
                this.destroyBin(binToMerge);

                return updatedBin;
              }
            }
          }

          return updatedBin;
        }

        // There were no viable candidates for our upper bound, and we reached the end of the array.
        // As such, if the first element in the bin is the first element on the original order, we can
        // use it as the bound in this special case.
        if (this.Original[0].id === updatedBin.elements[0]) {
          const zeroIndex = 0;
          updatedBin.upperBound = updatedBin.elements[zeroIndex];
          updatedBin.elements.shift();
          return updatedBin;
        }
      }

      updatedBin.upperBound = undefined;

      // If we are replacing the lower bound, we need to check elements lower in the list until we finda viable new lower bound.
    } else if (boundType === 'Lower') {
      const currentIndex =
        updatedBin.lowerBound !== undefined
          ? this.getCurrentPosition(updatedBin.lowerBound)
          : undefined;

      if (currentIndex === undefined) {
        throw new Error('Cannot rebound lower bin without a lower bound.');
      }

      for (let i = currentIndex + 1; i <= this.Current.length; i += 1) {
        const nextBoundId: IdType | undefined = this.Current[i]?.id || undefined;

        if (nextBoundId) {
          // The candidate for this bin's new lower bound is a static (umoved) element.
          if (this.hasNotMoved(nextBoundId)) {
            updatedBin.lowerBound = nextBoundId;

            // The candidate for this bin's new lower bound is a member element of another bin.
            // We should attempt to merge the two bins.
          } else {
            const binsToMergeCandidates = getBinsById(this.Delta, nextBoundId);

            if (!binsToMergeCandidates) {
              throw new Error(
                'Invalid delta state detected: The next candidate for a lower bound has been re-ordered, but is not in a bin.',
              );
            }

            for (const binToMerge of binsToMergeCandidates) {
              if (binToMerge !== updatedBin) {
                updatedBin.elements.push(...binToMerge.elements);
                updatedBin.lowerBound = binToMerge.lowerBound;
                this.destroyBin(binToMerge);

                return updatedBin;
              }
            }

            throw new Error(
              'Invalid delta state detected: The next candidate for an lower bound was located at an invalid index, or was not a mid-bound.',
            );
          }

          return updatedBin;
        }

        // There were no viable candidates for the lower bound, and we reached the end of the array.
        // As such, if the last element in the bin is the last element on the original order, we can
        // use it as the bound in this special case.
        if (
          this.Original[this.Original.length - 1].id ===
          updatedBin.elements[updatedBin.elements.length - 1]
        ) {
          updatedBin.lowerBound = updatedBin.elements[updatedBin.elements.length - 1];
          updatedBin.elements.pop();
          return updatedBin;
        }
      }

      updatedBin.lowerBound = undefined;
    }

    return updatedBin;
  }

  // Removes the target id from the target bin. If the id was a bound for the bin, a new bound is found in that direction.
  // After the removal, if the bin is no longer necessary or empty, the bin is destroyed.
  private removeIdFromBin(bin: OrderingBin, id: IdType): OrderingBin {
    let updatedBin: OrderingBin = bin;

    if (!this.Delta.includes(updatedBin)) {
      return updatedBin;
    }

    if (!updatedBin || !updatedBin.elements) {
      return updatedBin;
    }

    if (updatedBin.upperBound === id) {
      updatedBin = this.rebound(updatedBin, 'Upper', id);
    } else if (updatedBin.lowerBound === id) {
      updatedBin = this.rebound(updatedBin, 'Lower', id);
    } else {
      updatedBin.elements = updatedBin.elements.filter((element) => element !== id);
    }

    if (updatedBin.elements.length === 0 || !this.isBinNecessary(updatedBin)) {
      this.destroyBin(updatedBin);
    }

    return updatedBin;
  }

  // Method to attempt to move the element with the target id to the target position.
  private tryDrop(id: IdType, position: number): void {
    if (position >= this.Current.length || position < 0) {
      throw new Error('The target position is out of bounds.');
    }

    const currentPosition = this.getCurrentPosition(id);
    if (currentPosition === undefined) {
      throw new Error('An element with the requested ID could not be found.');
    }
    if (currentPosition === position) {
      return;
    }

    // When elements are repositioned from above, we need to account for the shift in indices due to its removal from the order.
    const sourceDirection: SourceDirection = currentPosition > position ? 'Below' : 'Above';

    const DeltaBeforeEdits = this.Delta.map((bin) => ({
      upperBound: bin.upperBound,
      elements: [...bin.elements],
      lowerBound: bin.lowerBound,
    }));

    // Remove the element from any bins it is currently in.
    const oldBins = getBinsById(this.Delta, id);
    for (let binNumber = 0; binNumber < oldBins.length; binNumber += 1) {
      const oldBin = oldBins[binNumber];
      if (binContainsId(oldBin, id)) {
        const updatedOldBin: OrderingBin = this.removeIdFromBin(oldBin, id);
        oldBins[binNumber] = updatedOldBin;
      }
    }

    // Determine if a bin exists that would contain element if moved to the target position.
    const nextBin = this.getBinByPosition(this.Delta, position, sourceDirection);
    const [originalUpperBound, originalLowerBound] = this.getOriginalBoundsById(id);

    // A bin exists that encompases the desired target position, so we should add the moved element to that bin.
    if (nextBin) {
      const currentPositionOfElementOriginallyInNextBin = this.getCurrentPosition(
        nextBin?.elements[0],
      );
      if (currentPositionOfElementOriginallyInNextBin === undefined) {
        throw new Error(
          'Invalid delta detected: The next bin was invalid. The bin did not contain any elements.',
        );
      }
      const nextBinBeforeEdits: OrderingBin | undefined = this.getBinByPosition(
        DeltaBeforeEdits,
        currentPositionOfElementOriginallyInNextBin,
        sourceDirection,
      );
      if (nextBinBeforeEdits === undefined) {
        throw new Error(
          'Invalid delta detected: An element that was originally a member of a bin could not be confirmed to have been previously assigned there.',
        );
      }

      const nextBinUpperBoundPosition =
        nextBin.upperBound !== undefined ? this.getCurrentPosition(nextBin.upperBound) : undefined;
      const nextBinLowerBoundPosition =
        nextBin.lowerBound !== undefined ? this.getCurrentPosition(nextBin.lowerBound) : undefined;

      // Opportunistic Rebounding
      if (sourceDirection === 'Above') {
        if (position === nextBinUpperBoundPosition && nextBin.upperBound === originalUpperBound) {
          nextBin.upperBound = id;
          return;
        }
        if (
          (position + 1 <= this.Original.length - 1 &&
            position + 1 === nextBinLowerBoundPosition) ||
          (position + 1 > this.Original.length - 1 && nextBinLowerBoundPosition === undefined)
        ) {
          if (nextBin.lowerBound === originalLowerBound) {
            nextBin.lowerBound = id;
            return;
          }
        }
      } else {
        if (
          (position - 1 >= 0 && position - 1 === nextBinUpperBoundPosition) ||
          (position - 1 < 0 && nextBinUpperBoundPosition === undefined)
        ) {
          if (nextBin.upperBound === originalUpperBound) {
            nextBin.upperBound = id;
            return;
          }
        }
        if (position === nextBinLowerBoundPosition && nextBin.lowerBound === originalLowerBound) {
          nextBin.lowerBound = id;
          return;
        }
      }

      // We could not opportunistically rebound a bin, so we intend to add the target element to the existing bin's elements.
      // As such, we need to calculate the index at which to insert the moved element in the next bin's elements.
      let currentPositionalDifference = Math.abs(position - (nextBinUpperBoundPosition ?? -1)) - 1;

      if (sourceDirection === 'Above' && nextBinBeforeEdits !== undefined) {
        const currentPositionOfNextBinBeforeEditsLowerBound =
          nextBinBeforeEdits.lowerBound !== undefined
            ? (this.getCurrentPosition(nextBinBeforeEdits.lowerBound) ?? 0)
            : 0;

        if (
          !(
            nextBinBeforeEdits?.elements.some((checkId) => checkId === id) ||
            nextBinBeforeEdits.upperBound === id ||
            (nextBinBeforeEdits.lowerBound === id &&
              currentPositionOfNextBinBeforeEditsLowerBound < position)
          ) ||
          nextBinBeforeEdits?.elements.some((checkId) => checkId === nextBin.upperBound)
        ) {
          currentPositionalDifference += 1;
        }
      }

      currentPositionalDifference = Math.max(currentPositionalDifference, 0);

      nextBin.elements.splice(currentPositionalDifference, 0, id);

      this.trySplitBin(nextBin);
    } else {
      // No bin existed at the target position, so we need to create a new bin unless it is next to one of its original bounds.
      const [currentTargetUpperBound, currentTargetLowerBound] = this.getCurrentBoundsByPosition(
        sourceDirection === 'Above' ? position + 1 : position,
        id,
      );

      if (
        !(
          currentTargetUpperBound === originalUpperBound ||
          currentTargetLowerBound === originalLowerBound
        )
      ) {
        const newBin: OrderingBin = {
          upperBound: currentTargetUpperBound,
          elements: [id],
          lowerBound: currentTargetLowerBound,
        };
        this.Delta.push(newBin);
      }
    }
  }

  private commitMove(from: number, to: number, object: Orderable): void {
    if (this.Current[from] !== object) {
      return;
    }

    this.Current.splice(from, 1);
    this.Current.splice(to, 0, object);
  }

  public drop(id: IdType, position: number): void {
    this.tryDrop(id, position);

    const currentPosition = this.getCurrentPosition(id);
    if (currentPosition === undefined) {
      return;
    }
    this.commitMove(currentPosition, position, this.Current[currentPosition]);
  }

  public append(entry: Orderable): void {
    this.Current.push(entry);
    this.Original.push(entry);

    const binWithoutLowerBound = this.Delta.find((bin) => bin.lowerBound === undefined);
    if (binWithoutLowerBound) {
      binWithoutLowerBound.lowerBound = entry.id;
    }
  }

  // Total number of elements actively being moved by the current Delta.
  // Bin bounds are static anchors describing where moved elements land, so they are NOT
  // counted here; only ids in bin.elements count as "reordered." This matches the shape of
  // the server payload (`Ids: bin.elements`) sent by updateBadgesOrder.
  public get reorderedCount(): number {
    return this.Delta.reduce((total, bin) => total + bin.elements.length, 0);
  }

  // Set of ids currently being moved (bin.elements across all bins). Used by the UI to
  // flag rows that belong to the current reorder batch. Must stay consistent with
  // reorderedCount; adding bound ids here would mis-report batch size.
  public get reorderedIds(): ReadonlySet<IdType> {
    const ids = new Set<IdType>();
    this.Delta.forEach((bin) => {
      bin.elements.forEach((id) => ids.add(id));
    });
    return ids;
  }

  // Returns a new Binning instance with independent Original / Current / Delta state,
  // suitable for simulating a drop without mutating `this`.
  //
  // Cloning contract (do not weaken without re-reading tryDrop / removeIdFromBin /
  // rebound / trySplitBin): drop() mutates Delta in several ways — it splices elements,
  // reassigns upperBound / lowerBound, and removes bins from the Delta array. Any shared
  // reference between the clone and the original is a silent corruption waiting to happen.
  //
  // Required invariants:
  //   - clone.Delta is a new array; each OrderingBin is a new object; each bin.elements
  //     is a new array. No references shared with this.Delta.
  //   - clone.Current is a new array. It shares Orderable references with clone.Original
  //     (mirroring the constructor's `this.Current = [...this.Original]`) so identity
  //     checks inside Binning (e.g. commitMove's `this.Current[from] !== object`) work.
  //   - clone.Original is a new array of shallow-cloned Orderables; the shape is not
  //     field-mutated by drop() today, but the spread makes the invariant explicit and
  //     resilient if that ever changes.
  public clone(): Binning {
    const clonedOrder: Orderable[] = this.Original.map((entry) => ({ ...entry }));
    const cloned = new Binning({ sourceOrder: clonedOrder });
    // Index cloned Original entries by id so rebuilding Current is O(n) instead of O(n^2).
    // Keep the FIRST occurrence per id to exactly mirror the previous clonedOrder.find().
    const idToClonedEntry = new Map<IdType, Orderable>();
    clonedOrder.forEach((entry) => {
      if (!idToClonedEntry.has(entry.id)) {
        idToClonedEntry.set(entry.id, entry);
      }
    });
    cloned.Current = this.Current.map((entry) => idToClonedEntry.get(entry.id) ?? { ...entry });
    cloned.Delta = this.Delta.map((bin) => ({
      upperBound: bin.upperBound,
      elements: [...bin.elements],
      lowerBound: bin.lowerBound,
    }));
    return cloned;
  }
}

export default Binning;
