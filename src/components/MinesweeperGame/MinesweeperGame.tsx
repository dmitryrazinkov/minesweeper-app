import './MinesweeperGame.css';
import '../../Styles.css'
import Header from "../Header/Header";
import Menu from "../Menu/Menu";
import {GameConfig} from "./types";
import {useState} from "react";
//@ts-ignore
import MinesweeperWorkerConstructor, {MinesweeperWorker} from "../../workers/Minesweeper.worker";
import MinesweeperBoard from "../../utils/MinesweeperBoard/MinesweeperBoard";
import {Remote, wrap} from "comlink";

let minesweeperWorker: Remote<MinesweeperWorker>;
const minesweeperWorkerWrap = wrap<{ new (): MinesweeperWorker }>(new MinesweeperWorkerConstructor());

const wrapPromise = new minesweeperWorkerWrap()
wrapPromise.then((minesweeperWorkerRes) => {
  minesweeperWorker = minesweeperWorkerRes;
})

function MinesweeperGame() {
  const [config, setConfig] = useState<GameConfig>(
    {width: 50, height: 50, bombs: 10}
  );
  const [startTime, setStartTime] = useState<Date>();

  const startNewGame = async (newConfig?: GameConfig) => {
    const actualConfig = newConfig ?? config;
    if (newConfig) {
      setConfig(newConfig);
    }

    const board = new MinesweeperBoard(actualConfig.width, actualConfig.height, actualConfig.bombs, minesweeperWorker!);
    await board.setup();

    console.log(board);

    setStartTime(new Date());
  }

  return (
    <article className="minesweeper-game">
      <Menu config={config} onConfigChanged={startNewGame}></Menu>
      <main className="minesweeper-game__board">
        <Header leftBombs={config.bombs} startTime={startTime}></Header>
      </main>
    </article>
  );
}

export default MinesweeperGame;
