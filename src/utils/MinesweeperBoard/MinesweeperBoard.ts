import TypedFastBitSet from 'typedfastbitset';
import { MinesweeperWorker } from '../../workers/Minesweeper.worker';
import { isFlagged, isOpened } from './MinesweeperBoard.helpers';
import { TypedFastBitSetExt } from '../../types/typedfastbitset-extension';
import { Remote, transfer } from 'comlink';

/** Class representing a minesweeper board. */
export default class MinesweeperBoard {
  /**
   * A bitset representing bombs locations, 1 - has bomb, 0 - no bomb.
   * @type {TypedFastBitSet}
   */
  bombsLocations = new TypedFastBitSet();
  /**
   * A bitset representing opened cells, 1 - opened, 0 - closed.
   * @type {TypedFastBitSet}
   */
  openedCells = new TypedFastBitSet();
  /**
   * A bitset representing flagged cells, 1 - flagged, 0 - not flagged.
   * @type {TypedFastBitSet}
   */
  flaggedCells = new TypedFastBitSet();

  /**
   * Indicates if the game is lost.
   * @type {boolean}
   */
  gameOver = false;

  /**
   * Random empty cell as we never want the first click on the board to lose the game.
   * @type {number}
   */
  private randomEmptyCell?: number;

  /**
   * Indicates if the game is successfully completed.
   * @type {boolean}
   */
  winner = false;

  /**
   * Indicates if the game is successfully completed
   * @type {boolean}
   */
  get bombsLeft() {
    return this.bombs - this.flaggedCells.size();
  }

  constructor(
    public readonly width: number,
    public readonly height: number,
    public readonly bombs: number,
    private readonly minesweeperWorker: Remote<MinesweeperWorker>
  ) {}

  /**
   * Set ups the board. Bombs locations is generated in a web worker.
   */
  async setup() {
    const { buffer, randomEmptyCell } = await this.minesweeperWorker.generateBoard(
      this.width,
      this.height,
      this.bombs
    );
    this.randomEmptyCell = randomEmptyCell;

    this.bombsLocations = (TypedFastBitSet as typeof TypedFastBitSetExt).fromWords(
      new Uint32Array(buffer)
    );
  }

  /**
   * Reveals a cell. Cell is revealed in a web worker.
   * If a cell has a bomb, all bombs on the board will be revealed and user loses the game.
   * If a cell doesn't have a bomb, the cell will open up if it's a number. If it's an empty cell then it will reveal nearby cells until it's reaches a number or the edge of the board.
   */
  async revealCell(xCoord: number, yCoord: number) {
    if (
      isOpened(xCoord, yCoord, this.width, this.openedCells) ||
      isFlagged(xCoord, yCoord, this.width, this.flaggedCells)
    ) {
      return;
    }

    if (this.hasBomb(xCoord, yCoord)) {
      // We never want the first click on the board to lose the game
      if (this.openedCells.size() === 0 && this.randomEmptyCell) {
        this.bombsLocations.remove(xCoord + yCoord * this.width);
        this.bombsLocations.add(this.randomEmptyCell);
        await this.revealCell(xCoord, yCoord);
        return;
      }

      this.gameOver = true;
      this._openCell(xCoord, yCoord);
      return;
    }

    const openedCellsBuf = (this.openedCells as TypedFastBitSetExt).words;
    const bombsLocationsBuf = (this.bombsLocations as TypedFastBitSetExt).words;
    const flaggedCellsBuf = (this.flaggedCells as TypedFastBitSetExt).words;

    const { flaggedCellsRes, openedCellsRes, bombsLocationsRes } =
      await this.minesweeperWorker.revealCell(
        xCoord,
        yCoord,
        this.width,
        this.height,
        transfer(openedCellsBuf, [openedCellsBuf.buffer]),
        transfer(bombsLocationsBuf, [bombsLocationsBuf.buffer]),
        transfer(flaggedCellsBuf, [flaggedCellsBuf.buffer])
      );
    this.openedCells = (TypedFastBitSet as typeof TypedFastBitSetExt).fromWords(
      new Uint32Array(openedCellsRes)
    );
    this.bombsLocations = (TypedFastBitSet as typeof TypedFastBitSetExt).fromWords(
      new Uint32Array(bombsLocationsRes)
    );
    this.flaggedCells = (TypedFastBitSet as typeof TypedFastBitSetExt).fromWords(
      new Uint32Array(flaggedCellsRes)
    );
    this.winner =
      !this.gameOver && this.bombs === this.width * this.height - this.openedCells.size();
  }

  private _openCell(xCoord: number, yCoord: number) {
    const positionInBitSet = xCoord + yCoord * this.width;
    this.openedCells.add(positionInBitSet);
  }

  /**
   * Flags a cell.
   * If a cell is not flagged, plants a flag on the cell.
   * If a cell is flagged, removes a flag.
   */
  flagCell(xCoord: number, yCoord: number): boolean {
    const positionInBitSet = xCoord + yCoord * this.width;

    if (!isFlagged(xCoord, yCoord, this.width, this.flaggedCells) && this.bombsLeft <= 0) {
      return false;
    }

    if (isOpened(xCoord, yCoord, this.width, this.openedCells)) {
      return false;
    }

    this.flaggedCells.flip(positionInBitSet);

    return true;
  }

  /**
   * Check is a particular cell has bomb.
   * @param {number} xCoord - x coordinate of a cell.
   * @param {number} yCoord - y coordinate of a cell.
   * @returns {boolean} - true if has bombs, false if there is no bomb.
   */
  hasBomb(xCoord: number, yCoord: number) {
    const positionInBitSet = xCoord + yCoord * this.width;

    return this.bombsLocations.has(positionInBitSet);
  }
}
