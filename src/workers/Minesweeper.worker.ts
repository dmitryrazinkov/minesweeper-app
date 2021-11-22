import * as Comlink from 'comlink';
import TypedFastBitSet from 'typedfastbitset';
import {
  calcBombsAround,
  getNeighborCells,
  isOpened
} from '../utils/MinesweeperBoard/MinesweeperBoard.helpers';
import { TypedFastBitSetExt } from '../types/typedfastbitset-extension';

export class MinesweeperWorker {
  /**
   * Generates a minesweeper board.
   * @param {number} width - The width of a board.
   * @param {number} height - The height of a board.
   * @param {number} bombs - Number of bombs to be planted.
   */
  generateBoard(width: number, height: number, bombs: number) {
    // we need get a random empty cell to be able to swap it with a bomb on first click (if bomb is clicked)
    let emptyCellsCount = width * height - bombs;
    const randomEmptyCellNumber = Math.floor(Math.random() * emptyCellsCount) + 1;
    let randomEmptyCell = 0;

    const size = width * height;
    const bombsLocations = new TypedFastBitSet();

    for (let i = 0; i < bombs; i++) {
      bombsLocations.add(i);
    }

    for (let i = size - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      let random = bombsLocations.has(j);
      let current = bombsLocations.has(i);

      if (!random) {
        if (randomEmptyCellNumber === emptyCellsCount) {
          randomEmptyCell = i;
        }

        emptyCellsCount--;
      }

      if (current === random) {
        continue;
      }

      current ? bombsLocations.remove(i) : bombsLocations.add(i);
      random ? bombsLocations.remove(j) : bombsLocations.add(j);
    }

    bombsLocations.trim();

    // todo 'typedfastbitset' lib has an issue with typings, need to make a PR
    return Comlink.transfer(
      { buffer: (bombsLocations as TypedFastBitSetExt).words.buffer, randomEmptyCell },
      [(bombsLocations as TypedFastBitSetExt).words.buffer]
    );
  }

  /**
   * Reveals a cell.
   * @param {number} xCoord - x coordinate of a cell.
   * @param {number} yCoord - y coordinate of a cell.
   * @param {number} width - The width of a board.
   * @param {number} height - The height of a board.
   * @param {ArrayBuffer} openedCellsBuf - ArrayBuffer representing a bitset with opened cells. Passed as transferable.
   * @param {ArrayBuffer} bombsLocationsBuf - ArrayBuffer representing a bitset with bombs locations. Passed as transferable.
   * @param {ArrayBuffer} flaggedCellsBuf - ArrayBuffer representing a bitset with opened cells. Passed as transferable.
   */
  revealCell(
    xCoord: number,
    yCoord: number,
    width: number,
    height: number,
    openedCellsBuf: ArrayBuffer,
    bombsLocationsBuf: ArrayBuffer,
    flaggedCellsBuf: ArrayBuffer
  ) {
    const bombsLocations = (TypedFastBitSet as typeof TypedFastBitSetExt).fromWords(
      new Uint32Array(bombsLocationsBuf)
    );
    const openedCells = (TypedFastBitSet as typeof TypedFastBitSetExt).fromWords(
      new Uint32Array(openedCellsBuf)
    );
    const flaggedCells = (TypedFastBitSet as typeof TypedFastBitSetExt).fromWords(
      new Uint32Array(flaggedCellsBuf)
    );

    // We use stack instead of recursive calls in order to avoid call stack exceed.
    const stack: Array<number> = [xCoord + yCoord * height];
    const processedItems = new TypedFastBitSet([xCoord + yCoord * height]);

    while (stack.length > 0) {
      const location = stack.pop()!;
      let cell = { xCoord: location % width, yCoord: Math.floor(location / height) };
      const bombsAround = calcBombsAround(cell.xCoord, cell.yCoord, width, height, bombsLocations);
      if (bombsAround === 0) {
        getNeighborCells(cell!.xCoord, cell!.yCoord, width, height).forEach(
          ({ xCoord, yCoord }) => {
            const location = xCoord + yCoord * width;
            if (!isOpened(xCoord, yCoord, width, openedCells) && !processedItems.has(location)) {
              stack.push(location);
              processedItems.add(location);
            }
          }
        );
      }

      const positionInBitSet = cell.xCoord + cell.yCoord * width;
      openedCells.add(positionInBitSet);
      flaggedCells.remove(positionInBitSet);
    }

    const openedCellsRes = (openedCells as TypedFastBitSetExt).words;
    const bombsLocationsRes = (bombsLocations as TypedFastBitSetExt).words;
    const flaggedCellsRes = (flaggedCells as TypedFastBitSetExt).words;

    return Comlink.transfer(
      {
        openedCellsRes,
        bombsLocationsRes,
        flaggedCellsRes
      },
      [openedCellsRes.buffer, bombsLocationsRes.buffer, flaggedCellsRes.buffer]
    );
  }
}

Comlink.expose(MinesweeperWorker);
