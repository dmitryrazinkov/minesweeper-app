import {HeaderProps} from "./types";
import {useEffect, useState} from "react";
import './Header.css'

function Header({bombsLeft, startTime, gameOver, winner}: HeaderProps) {
  const [timePast, setTimePast] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (gameOver || winner) {
        clearInterval(intervalId);
        return;
      }

      if (startTime) {
        setTimePast(Math.floor((new Date().getTime() - startTime.getTime())/1000));
      } else {
        setTimePast(0);
      }
    }, 100);

    return () => clearInterval(intervalId);
  });

  return (
    <header className="board-header">
      <span className="board-header__bombs">{bombsLeft}</span>
      <button className="board-header__btn">happy face</button>
      <span className="board-header__time">{timePast}</span>
    </header>
  )
}

export default Header;
