import {HeaderProps} from "./types";
import {useEffect, useState} from "react";
import './Header.css'

function Header(props: HeaderProps) {
  const [timePast, setTimePast] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (props.startTime) {
        setTimePast(Math.floor((new Date().getTime() - props.startTime.getTime())/1000));
      } else {
        setTimePast(0);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  });

  return (
    <header className="board-header">
      <span className="board-header__bombs">{props.leftBombs}</span>
      <button className="board-header__btn">happy face</button>
      <span className="board-header__time">{timePast}</span>
    </header>
  )
}

export default Header;
