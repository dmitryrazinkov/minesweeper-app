import TypedFastBitSet from "typedfastbitset";
import {MinesweeperWorker} from "../../workers/Minesweeper.worker";
import {calcBombsAround, getNeighborCells} from "./MinesweeperBoard.helpers";
import {CellLocation} from "./types";
import {TypedFastBitSetExt} from "../../types/typedfastbitset-extension";
import {Remote} from "comlink";

export default class MinesweeperBoard {
  private bombsLocations = new TypedFastBitSet();
  private openedCells = new TypedFastBitSet();
  private flaggedCells = new TypedFastBitSet();

  constructor(public readonly width: number, public readonly height: number, public readonly bombs: number, private readonly minesweeperWorker: Remote<MinesweeperWorker>) {}

  async setup() {
    this.bombsLocations = (<typeof TypedFastBitSetExt>TypedFastBitSet).fromWords(new Uint32Array(await this.minesweeperWorker.generateBoard(this.width, this.height, this.bombs)))
  }

  revealCell(xCoord: number, yCoord: number) {
    if (this.isOpened(xCoord, yCoord) || this.isFlagged(xCoord, yCoord)) {
      return;
    }

    if (this.hasBomb(xCoord, yCoord)) {
      //todo game over
      this._openCell(xCoord, yCoord);
      return;
    }

    this._revealCell(xCoord, yCoord);
  }

  private _openCell (xCoord: number, yCoord: number) {
    const positionInBitSet = xCoord  + yCoord * this.width;
    this.openedCells.add(positionInBitSet);
  }

  private _revealCell(xCoord: number, yCoord: number) {
    // We use stack instead of recursive calls in order to avoid call stack exceed.
    const stack: Array<CellLocation> = [{xCoord, yCoord}];
    const processedItems = new TypedFastBitSet([xCoord  + yCoord*this.height]);

    while (stack.length > 0) {
      const cell = stack.pop()!;
      const bombsAround = calcBombsAround(cell.xCoord, cell.yCoord, this.width, this.height, this.bombsLocations);
      if (bombsAround === 0) {
        getNeighborCells(cell!.xCoord, cell!.yCoord, this.width, this.height).forEach(({xCoord, yCoord}) => {
          if (!this.isOpened(xCoord, yCoord) && !processedItems.has(xCoord  + yCoord*this.width)) {
            stack.push({xCoord, yCoord});
            processedItems.add(xCoord  + yCoord*this.width);
          }
        })
      }

      this._openCell(cell!.xCoord, cell!.yCoord);
    }
  }

  flagCell(xCoord: number, yCoord: number): boolean {
    const positionInBitSet = xCoord  + yCoord * this.width

    if (this.isOpened(xCoord, yCoord)) {
      return false;
    }

    this.flaggedCells.flip(positionInBitSet);

    return true;
  }

  hasBomb(xCoord: number, yCoord: number) {
    const positionInBitSet = xCoord  + yCoord * this.width

    return this.bombsLocations.has(positionInBitSet);
  }

  isFlagged(xCoord: number, yCoord: number) {
    const positionInBitSet = xCoord  + yCoord * this.width

    return this.flaggedCells.has(positionInBitSet);
  }

  isOpened(xCoord: number, yCoord: number) {
    const positionInBitSet = xCoord  + yCoord * this.width

    return this.openedCells.has(positionInBitSet);
  }
}
