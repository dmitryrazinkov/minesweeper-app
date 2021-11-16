import MinesweeperBoard from "../../utils/MinesweeperBoard/MinesweeperBoard";

export interface FieldProps {
  board: MinesweeperBoard,
  startTime: Date,
  onHeaderBtnClick: () => void

}
