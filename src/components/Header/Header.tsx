import { HeaderProps } from './types';
import { useEffect, useState } from 'react';
import './Header.css';
import deadFace from './dead-face.jpeg';
import happyFace from './happy-face.jpeg';

function Header({ bombsLeft, startTime, gameOver, winner, onHeaderBtnClick }: HeaderProps) {
  const [timePast, setTimePast] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (gameOver || winner) {
        clearInterval(intervalId);
        return;
      }

      if (startTime) {
        setTimePast(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
      } else {
        setTimePast(0);
      }
    }, 100);

    return () => clearInterval(intervalId);
  });

  return (
    <header className="board-header">
      <span className="board-header__bombs">{bombsLeft}</span>
      <button
        className="board-header__btn"
        onClick={onHeaderBtnClick}
        style={{ backgroundImage: `url(${gameOver ? deadFace : happyFace})` }}
      ></button>
      <span className="board-header__time">{timePast}</span>
    </header>
  );
}

export default Header;
