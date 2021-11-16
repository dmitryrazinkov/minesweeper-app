import './MinesweeperGame.css';
import spinner from './spinner.gif';
import '../../Styles.css';
import Menu from "../Menu/Menu";
import {GameConfig } from "./types";
import { useEffect, useState} from "react";
//@ts-ignore
import MinesweeperWorkerConstructor, {MinesweeperWorker} from "../../workers/Minesweeper.worker";
import MinesweeperBoard from "../../utils/MinesweeperBoard/MinesweeperBoard";
import {Remote, wrap} from "comlink";
import Field from "../Field/Field";
import {LoaderContext} from "./loader-context";
import {wait} from "../../utils/wait";

let minesweeperWorker: Remote<MinesweeperWorker>;
const minesweeperWorkerWrap = wrap<{ new (): MinesweeperWorker }>(new MinesweeperWorkerConstructor());
let isLoadingInternal = false;

function MinesweeperGame() {
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<GameConfig>(
    {width: 50, height: 50, bombs: 500}
  );
  const [startTime, setStartTime] = useState<Date>();
  const [board, setBoard] = useState<MinesweeperBoard>();

  useEffect(() => {
    const wrapPromise = new minesweeperWorkerWrap()
    wrapPromise.then((minesweeperWorkerRes) => {
      minesweeperWorker = minesweeperWorkerRes;
      void startNewGame();
    })
  }, []);

  const showLoader = async () => {
    isLoadingInternal = true;
    await wait(500);
    setIsLoading(isLoadingInternal);
  }

  const hideLoader = () => {
    isLoadingInternal = false;
    setIsLoading(false);
  }

  const startNewGame = async (newConfig?: GameConfig) => {
    if (isLoadingInternal) {
      return;
    }
    const actualConfig = newConfig ?? config;
    if (newConfig) {
      setConfig(newConfig);
    }

    showLoader();
    try {
      const minesweeperBoard = new MinesweeperBoard(actualConfig.width, actualConfig.height, actualConfig.bombs, minesweeperWorker!);
      await minesweeperBoard.setup();
      setBoard(minesweeperBoard);
      setStartTime(new Date());
    } finally {
      hideLoader();
    }
  }

  return (
    <LoaderContext.Provider value={{isLoading, show: showLoader, hide: hideLoader}}>
      <article className="minesweeper-game">
        <Menu config={config} onConfigChanged={startNewGame}/>
        <main className="minesweeper-game__board">
          {board && startTime && <Field board={board} startTime={startTime} onHeaderBtnClick={() => startNewGame()}/>}
        </main>
        {isLoading && <div className="blocker"><img src={spinner} alt="Loading wheel"/></div>}
      </article>
    </LoaderContext.Provider>
  );
}

export default MinesweeperGame;
