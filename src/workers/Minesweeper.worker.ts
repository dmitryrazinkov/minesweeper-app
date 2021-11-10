import  * as Comlink  from 'comlink';
import TypedFastBitSet from "typedfastbitset";
import {calcBombsAround, getNeighborCells, isOpened} from "../utils/MinesweeperBoard/MinesweeperBoard.helpers";
import {TypedFastBitSetExt} from "../types/typedfastbitset-extension";

export class MinesweeperWorker{
  /**
   * Generates a minesweeper board.
   * @param {number} width - The width of a board.
   * @param {number} height - The height of a board.
   * @param {number} bombs - Number of bombs to be planted.
   */
  generateBoard(width: number, height: number, bombs: number) {
    let map = new TypedFastBitSet()

    for (let i = 0; i < bombs; i++) {
      map.add(i);
    }

    map = shuffle(map, width * height);

    function shuffle(map: TypedFastBitSet, size: number){
      for(let i = size - 1; i > 0; i--){
        let j = Math.floor(Math.random()*(i + 1));
        let jValue = map.has(j);
        let iValue = map.has(i);

        if (iValue === jValue) {
          continue;
        }

        iValue? map.remove(i): map.add(i);
        jValue? map.remove(j): map.add(j);
      }
      return map;
    }

    map.trim();

    // todo 'typedfastbitset' lib has an issue with typings, need to make a PR
    return Comlink.transfer((map as TypedFastBitSetExt).words.buffer, [(map as TypedFastBitSetExt).words.buffer]);
  }

  revealCell(xCoord: number, yCoord: number, width: number, height: number, openedCellsBuf: ArrayBuffer, bombsLocationsBuf: ArrayBuffer, flaggedCellsBuf: ArrayBuffer) {
    const bombsLocations = (TypedFastBitSet as typeof TypedFastBitSetExt).fromWords(new Uint32Array(bombsLocationsBuf));
    const openedCells = (TypedFastBitSet as typeof TypedFastBitSetExt).fromWords(new Uint32Array(openedCellsBuf));
    const flaggedCells = (TypedFastBitSet as typeof TypedFastBitSetExt).fromWords(new Uint32Array(flaggedCellsBuf));

    // We use stack instead of recursive calls in order to avoid call stack exceed.
    const stack: Array<number> = [xCoord  + yCoord*height];
    const processedItems = new TypedFastBitSet([xCoord  + yCoord*height]);

    while (stack.length > 0) {
      const location = stack.pop()!;
      let cell = {xCoord: location % width, yCoord: Math.floor(location/height)};
      const bombsAround = calcBombsAround(cell.xCoord, cell.yCoord, width, height, bombsLocations);
      if (bombsAround === 0) {
        getNeighborCells(cell!.xCoord, cell!.yCoord, width, height).forEach(({xCoord, yCoord}) => {
          const location = xCoord  + yCoord*width;
          if (!isOpened(xCoord, yCoord, width, openedCells) && !processedItems.has(location)) {
            stack.push(location);
            processedItems.add(location);
          }
        })
      }

      const positionInBitSet = cell.xCoord  + cell.yCoord * width;
      openedCells.add(positionInBitSet);
      flaggedCells.remove(positionInBitSet);
    }

    const openedCellsRes = (openedCells as TypedFastBitSetExt).words;
    const bombsLocationsRes = (bombsLocations as TypedFastBitSetExt).words;
    const flaggedCellsRes = (flaggedCells as TypedFastBitSetExt).words;

    return Comlink.transfer({openedCellsRes, bombsLocationsRes, flaggedCellsRes}, [openedCellsRes.buffer, bombsLocationsRes.buffer, flaggedCellsRes.buffer]);
  }

}

Comlink.expose(MinesweeperWorker);

