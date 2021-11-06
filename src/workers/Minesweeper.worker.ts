import  * as Comlink  from 'comlink';
import TypedFastBitSet from "typedfastbitset";
import {calcBombsAround, getNeighborCells} from "../utils/MinesweeperBoard/MinesweeperBoard.helpers";
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

        if (iValue == jValue) {
          continue;
        }

        iValue? map.remove(i): map.add(i);
        jValue? map.remove(j): map.add(j);
      }
      return map;
    }

    map.trim();

    // todo 'typedfastbitset' lib has an issue with typings, need to make a PR
    return Comlink.transfer((<TypedFastBitSetExt>map).words.buffer, [(<TypedFastBitSetExt>map).words.buffer]);
  }

  //TODO
  revealCell(xCoord: number, yCoord: number, width: number, height: number, openedCellsBuf: ArrayBuffer, bombsLocationsBuf: ArrayBuffer) {
    const openedCells: TypedFastBitSet = (<typeof TypedFastBitSetExt>TypedFastBitSet).fromWords(new Uint32Array(openedCellsBuf));
    const bombsLocations: TypedFastBitSet = (<typeof TypedFastBitSetExt>TypedFastBitSet).fromWords(new Uint32Array(bombsLocationsBuf));

    // use stack instead of recursive calls in order to avoid call stack exceed
    const stack = [{xCoord, yCoord}];
    const processedItems = new TypedFastBitSet([xCoord  + yCoord*width]);

    while (stack.length > 0) {

      const cell = stack.pop();
      const bombsAround = calcBombsAround(cell!.xCoord, cell!.yCoord, width, height, bombsLocations);
      if (bombsAround === 0) {
        getNeighborCells(cell!.xCoord, cell!.yCoord, width, height).forEach(({xCoord, yCoord}) => {
          if (!openedCells.has(xCoord + yCoord*width) && !processedItems.has(xCoord  + yCoord*width)) {
            stack.push({xCoord, yCoord});
            processedItems.add(xCoord  + yCoord*width);
          }
        })
      }

      const positionInBitSet = cell!.xCoord  + cell!.yCoord * width;
      openedCells.add(positionInBitSet);
    }
  }

}

Comlink.expose(MinesweeperWorker);

