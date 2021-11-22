import MinesweeperBoard from '../../utils/MinesweeperBoard/MinesweeperBoard';

export interface FieldProps {
  board: MinesweeperBoard;
  startTime: Date;
  onHeaderBtnClick: () => void;
}

export interface VisibleField {
  from: {
    x: number;
    y: number;
  };
  to: {
    x: number;
    y: number;
  };
}
