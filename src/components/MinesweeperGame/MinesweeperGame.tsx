import './MinesweeperGame.css';
import '../../Styles.css'
import Header from "../Header/Header";
import Menu from "../Menu/Menu";
import {GameConfig} from "./types";
import {useState} from "react";

function MinesweeperGame() {
  const [config, setConfig] = useState<GameConfig>(
    {width: 50, height: 50, bombs: 10}
  );
  const [startTime, setStartTime] = useState<Date>();

  const startNewGame = (config?: GameConfig) => {
    setStartTime(new Date());
    if (config) {
      setConfig(config);
    }
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
