import TypedFastBitSet from "typedfastbitset";
import {CellLocation} from "./types";

/**
 * Calculates the number of bombs around a particular cell.
 * @param {number} xCoord - x coordinate of a cell.
 * @param {number} yCoord - y coordinate of a cell.
 * @param {number} width - The width of a board.
 * @param {number} height - The height of a board.
 * @param {TypedFastBitSet} bombsLocations - BitSet that represents bombs location.
 * @returns {number} - Number of bombs around a particular cell.
 */
export function calcBombsAround(xCoord: number, yCoord: number, width: number, height: number, bombsLocations: TypedFastBitSet): number {
  return getNeighborCells(xCoord, yCoord, width, height).reduce<number>((count, cell)=> {
    return count + Number(bombsLocations.has(cell.yCoord*width + cell.xCoord))
  }, 0);
}

/**
 * Gets cell locations around a particular cell.
 * @param {number} xCoord - x coordinate of a cell.
 * @param {number} yCoord - y coordinate of a cell.
 * @param {number} width - The width of a board.
 * @param {number} height - The height of a board.
 * @returns {Array<CellLocation>} - An array of cells around a particular cell(up to 8).
 */
export function getNeighborCells(xCoord: number, yCoord: number, width: number, height: number) {
  const cells: Array<CellLocation> = [];
  const leftMost = xCoord % width === 0;
  const rightMost = xCoord % width + 1 === width;
  const topMost = yCoord === 0;
  const bottomMost = yCoord + 1 === height;

  if (!leftMost) {
    cells.push({xCoord: xCoord - 1, yCoord});
    if (!topMost) {
      cells.push({xCoord: xCoord - 1, yCoord: yCoord - 1});
    }

    if (!bottomMost) {
      cells.push({xCoord: xCoord - 1, yCoord: yCoord + 1});
    }
  }

  if (!rightMost) {
    cells.push({xCoord: xCoord + 1, yCoord});

    if (!topMost) {
      cells.push({xCoord: xCoord + 1, yCoord: yCoord - 1});
    }

    if (!bottomMost) {
      cells.push({xCoord: xCoord + 1, yCoord: yCoord + 1});
    }
  }

  if (!topMost) {
    cells.push({xCoord: xCoord, yCoord: yCoord - 1});
  }

  if (!bottomMost) {
    cells.push({xCoord: xCoord, yCoord: yCoord + 1});
  }

  return cells;
}
