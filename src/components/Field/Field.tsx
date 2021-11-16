import React, {useContext, useEffect, useRef, useState} from "react";
import './Field.css';
import flag from './flag.png';
import bomb from './bomb.png';
import {cellWidth, imageWidth, maxVisibleCells, renderedLength, viewportWidth} from "./fieldConfig";
import {FieldProps} from "./types";
import Header from "../Header/Header";
import {calcBombsAround, isOpened} from "../../utils/MinesweeperBoard/MinesweeperBoard.helpers";
import {LoaderContext} from "../MinesweeperGame/loader-context";
import {debounce} from "../../utils/debounce";

function Field({board, startTime, onHeaderBtnClick}: FieldProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const flagImage = useRef<HTMLImageElement>(null);
  const bombImage = useRef<HTMLImageElement>(null);
  const scrollContainer = useRef<HTMLDivElement>(null);
  const renderedXLength = board.width > renderedLength ? renderedLength : board.width;
  const renderedYLength = board.height > renderedLength ? renderedLength : board.height;
  const canvasWidth = renderedXLength * cellWidth;
  const canvasHeight = renderedYLength * cellWidth;
  const loader = useContext(LoaderContext);
  const [visibleField, setVisibleField] = useState({
    from: {
      x: 0,
      y: 0
    },
    to: {
      x: renderedXLength - 1,
      y: renderedYLength - 1
    }
  });
  const [bombsLeft, setBombsLeft] = useState<number>(board.bombsLeft);
  const [gameOver, setGameOver] = useState<boolean>(board.gameOver);
  const [winner, setWinner] = useState<boolean>(board.winner);

  useEffect(() => {
    setBombsLeft(board.bombsLeft);
    setWinner(board.winner);
    setGameOver(board.gameOver);
    if (canvas.current) {
      const ctx = canvas.current.getContext('2d');
      if (ctx) {
        drawField(ctx, 0, 0);
      }
    }
  }, [board]);

  const onScroll = debounce((e: React.UIEvent<HTMLElement>) => {
    if (canvas.current) {
      const ctx = canvas.current.getContext('2d');
      if (ctx) {
        drawField(ctx, (e.target as HTMLElement).scrollLeft, (e.target as HTMLElement).scrollTop);
      }
    }
  }, 50);

  async function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>, isRightClick = true) {
    e.preventDefault();
    if (board.gameOver || board.winner) {
      return;
    }
    const rect = canvas.current!.getBoundingClientRect();
    const xCoord = visibleField.from.x + Math.floor((e.clientX - rect.left) / cellWidth);
    const yCoord = visibleField.from.y + Math.floor((e.clientY - rect.top) / cellWidth);

    if (isRightClick) {
      flagCell(xCoord, yCoord);
    } else {
      await revealCell(xCoord, yCoord);
    }
  }

  async function revealCell(xCoord: number, yCoord: number) {
    const ctx = canvas.current!.getContext('2d');

    loader.show();
    try {
      await board.revealCell(xCoord, yCoord);
      setGameOver(board.gameOver);
      setBombsLeft(board.bombsLeft);
      setWinner(board.winner);
      drawField(ctx!, scrollContainer.current!.scrollLeft, scrollContainer.current!.scrollTop);
    } finally {
      loader.hide();
    }
  }

  function flagCell(xCoord: number, yCoord: number) {
    const changed = board.flagCell(xCoord, yCoord);

    if (changed) {
      const ctx = canvas.current!.getContext('2d');
      redrawCell(ctx!, xCoord, yCoord);
      setBombsLeft(board.bombsLeft);
    }
  }

  function drawField(ctx: CanvasRenderingContext2D, scrollLeft: number, scrollTop: number) {
    const visiblePart = calcVisiblePart(scrollLeft, scrollTop);

    setVisibleField(calcVisiblePart(scrollLeft, scrollTop));

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    ctx.lineWidth = 1;

    for (let i = 0; i <= renderedXLength; i++) {
      for (let j = 0; j <= renderedYLength; j++) {
        const xCoord = i + visiblePart.from.x;
        const yCoord = j + visiblePart.from.y;

        drawCell(ctx, xCoord, yCoord, i, j);
      }
    }
  }

  function clearCell(ctx: CanvasRenderingContext2D, xCoord: number, yCoord: number) {
    ctx!.clearRect((xCoord - visibleField.from.x) * cellWidth, (yCoord - visibleField.from.y) * cellWidth - 1, cellWidth, cellWidth);
  }

  function redrawCell(ctx: CanvasRenderingContext2D, xCoord: number, yCoord: number) {
    if (visibleField.from.x <= xCoord && visibleField.to.x >= xCoord && visibleField.from.y <= yCoord && visibleField.to.y >= yCoord) {
      clearCell(ctx!, xCoord, yCoord);
      drawCell(ctx!, xCoord, yCoord, xCoord - visibleField.from.x, yCoord - visibleField.from.y);
    }
  }

  function drawCell(ctx: CanvasRenderingContext2D, xCoord: number, yCoord: number, xRelative: number, yRelative: number) {
    const xPos = xRelative * cellWidth;
    const yPos = yRelative * cellWidth - 1;

    // todo introduce drawOpened and drawClosed
    ctx.strokeStyle = '#818181';
    ctx.fillStyle = '#c6c6c6';

    const hasBomb = board.hasBomb(xCoord, yCoord);

    if (isOpened(xCoord, yCoord, board.width, board.openedCells) || (board.gameOver && hasBomb)) {
      ctx.strokeRect(xPos + 1, yPos + 1, cellWidth - 2, cellWidth - 2);
      ctx.fillRect(xPos + 1, yPos + 1, cellWidth - 2, cellWidth - 2);

      if (hasBomb) {
        drawBombCell(ctx, xRelative, yRelative);
        return;
      }

      const bombsAround = calcBombsAround(xCoord, yCoord, board.width, board.height, board.bombsLocations);

      if (bombsAround > 0) {
        drawNumberCell(ctx, xRelative, yRelative, bombsAround);
      }
    } else {
      ctx.strokeRect(xPos + 1, yPos + 1, cellWidth - 2, cellWidth - 2);

      if (board.isFlagged(xCoord, yCoord)) {
        drawFlagCell(ctx, xRelative, yRelative);
      }
    }
  }

  function drawFlagCell(ctx: CanvasRenderingContext2D, xRelative: number, yRelative: number) {
    ctx.drawImage(flagImage.current!, xRelative * cellWidth + 2, yRelative * cellWidth + 2, imageWidth, imageWidth)
  }

  function drawBombCell(ctx: CanvasRenderingContext2D, xRelative: number, yRelative: number) {
    ctx.drawImage(bombImage.current!, xRelative * cellWidth + 2, yRelative * cellWidth + 2, imageWidth, imageWidth)
  }

  function drawNumberCell(ctx: CanvasRenderingContext2D, xRelative: number, yRelative: number, bombsAround: number) {
    ctx.font = '16px serif';
    ctx.fillStyle = "red";
    // approximate number width and height
    ctx.fillText(bombsAround.toString(), xRelative * cellWidth + 6, yRelative * cellWidth + 16);
  }


  function calcVisiblePart(scrollLeft: number, scrollTop: number) {
    const result = {
      from: {
        x: 0,
        y: 0
      },
      to: {
        x: renderedXLength - 1,
        y: renderedYLength - 1
      }
    }

    const bufferOffsetX = (renderedXLength - maxVisibleCells) / 2;
    const bufferOffsetY = (renderedXLength - maxVisibleCells) / 2;
    const leftOffset = scrollLeft / cellWidth;
    const topOffset = scrollTop / cellWidth;

    if (leftOffset > bufferOffsetX && renderedXLength >= renderedLength) {
      if (scrollLeft + viewportWidth + bufferOffsetX * cellWidth > board.width * cellWidth) {
        result.from.x = board.width - renderedXLength;
        result.to.x = board.width - 1;
      } else {
        result.from.x = Math.round(leftOffset) - bufferOffsetX;
        result.to.x = result.from.x + renderedXLength;
      }
    }

    if (topOffset > bufferOffsetY && renderedYLength >= renderedLength) {
      if (scrollTop + viewportWidth + bufferOffsetY * cellWidth > board.height * cellWidth) {
        result.from.y = board.height - renderedYLength;
        result.to.y = board.height - 1;
      } else {
        result.from.y = Math.round(topOffset) - bufferOffsetY;
        result.to.y = result.from.y + renderedYLength;
      }
    }

    return result;
  }

  return (
    <div className="field">
      <Header bombsLeft={bombsLeft} gameOver={gameOver} winner={winner} startTime={startTime} onHeaderBtnClick={onHeaderBtnClick}/>
      <div className='container' ref={scrollContainer} onScroll={onScroll}>
        <div className='scroll-container' style={{width: cellWidth * board.width, height: cellWidth * board.height}}>
          <canvas ref={canvas}
                  onClick={(e) => onMouseDown(e, false)}
                  onContextMenu={onMouseDown}
                  width={canvasWidth}
                  height={canvasHeight}
                  style={{left: visibleField.from.x * cellWidth, top: visibleField.from.y * cellWidth}}>
          </canvas>
        </div>
        <img ref={flagImage} src={flag} alt=""/>
        <img ref={bombImage} src={bomb} alt=""/>
      </div>
    </div>
  )
};

export default Field;
