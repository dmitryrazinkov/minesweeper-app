import TypedFastBitSet from "typedfastbitset";
import {MinesweeperWorker} from "../../workers/Minesweeper.worker";
import {isOpened} from "./MinesweeperBoard.helpers";
import {TypedFastBitSetExt} from "../../types/typedfastbitset-extension";
import {Remote, transfer} from "comlink";

export default class MinesweeperBoard {
  bombsLocations = new TypedFastBitSet();
  openedCells = new TypedFastBitSet();
  flaggedCells = new TypedFastBitSet();

  gameOver = false;

  get winner() {
    return !this.gameOver && (this.bombs === this.width*this.height - this.openedCells.size());
  }

  get bombsLeft() {
    return this.bombs - this.flaggedCells.size();
  }

  constructor(public readonly width: number, public readonly height: number, public readonly bombs: number, private readonly minesweeperWorker: Remote<MinesweeperWorker>) {
  }

  async setup() {
    this.bombsLocations = (TypedFastBitSet as typeof TypedFastBitSetExt).fromWords(new Uint32Array(await this.minesweeperWorker.generateBoard(this.width, this.height, this.bombs)))
  }

  async revealCell(xCoord: number, yCoord: number) {
    if (isOpened(xCoord, yCoord, this.width, this.openedCells) || this.isFlagged(xCoord, yCoord)) {
      return;
    }

    if (this.hasBomb(xCoord, yCoord)) {
      this.gameOver = true;
      this._openCell(xCoord, yCoord);
      return;
    }

    const openedCellsBuf = (this.openedCells as TypedFastBitSetExt).words;
    const bombsLocationsBuf = (this.bombsLocations as TypedFastBitSetExt).words;
    const flaggedCellsBuf = (this.flaggedCells as TypedFastBitSetExt).words;

    const {flaggedCellsRes, openedCellsRes, bombsLocationsRes} = await this.minesweeperWorker.revealCell(
      xCoord, yCoord, this.width, this.height,
      transfer(openedCellsBuf, [openedCellsBuf.buffer]),
      transfer(bombsLocationsBuf, [bombsLocationsBuf.buffer]),
      transfer(flaggedCellsBuf, [flaggedCellsBuf.buffer])
      );
    this.openedCells = (TypedFastBitSet as typeof TypedFastBitSetExt).fromWords(new Uint32Array(openedCellsRes));
    this.bombsLocations = (TypedFastBitSet as typeof TypedFastBitSetExt).fromWords(new Uint32Array(bombsLocationsRes));
    this.flaggedCells = (TypedFastBitSet as typeof TypedFastBitSetExt).fromWords(new Uint32Array(flaggedCellsRes));
  }

  private _openCell(xCoord: number, yCoord: number) {
    const positionInBitSet = xCoord + yCoord * this.width;
    this.openedCells.add(positionInBitSet);
  }

  flagCell(xCoord: number, yCoord: number): boolean {
    const positionInBitSet = xCoord + yCoord * this.width

    if (!this.isFlagged(xCoord, yCoord) && this.bombsLeft <= 0) {
      return false;
    }

    if (isOpened(xCoord, yCoord, this.width, this.openedCells)) {
      return false;
    }

    this.flaggedCells.flip(positionInBitSet);

    return true;
  }

  hasBomb(xCoord: number, yCoord: number) {
    const positionInBitSet = xCoord + yCoord * this.width

    return this.bombsLocations.has(positionInBitSet);
  }

  isFlagged(xCoord: number, yCoord: number) {
    const positionInBitSet = xCoord + yCoord * this.width

    return this.flaggedCells.has(positionInBitSet);
  }
}
