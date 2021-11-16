import {GameConfig} from "../MinesweeperGame/types";
import {FieldError, useForm} from "react-hook-form";
import './Menu.css';
import {useEffect, useRef, useState} from "react";

const VALIDATORS = {
  width: { required: true, min: 3, max: 10000 },
  height: { required: true, min: 3, max: 10000 },
  bombs: { required: true, min: 1,  max: 10000 * 10000 - 1}
}

function Menu(props: {config: GameConfig, onConfigChanged: (config: GameConfig) => void}) {
  const [isMenuShown, setIsMenuShown] = useState<boolean>(false);
  const { register, handleSubmit, getValues, formState: { errors } } = useForm<GameConfig>({mode: "onChange"});
  const menu = useRef<HTMLFormElement>(null);

  // handle outside click - it should close menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;

      if (menu.current && !menu.current.contains(target) && !target.closest('.menu__new-game-btn')) {
        setIsMenuShown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menu]);

  const getErrorMessage = (error: FieldError) => {
    const fieldName = error.ref?.name as keyof typeof VALIDATORS | undefined;

    if (error.message) {
      return error.message;
    }

    if (error.type === 'required') {
      return "The field is required.";
    }

    if (error.type === 'min' && fieldName) {
      return `The field should be more or equal ${VALIDATORS[fieldName].min}.`;
    }

    if (error.type === 'max' && fieldName) {
      return `The field should less or equal ${VALIDATORS[fieldName].max}.`;
    }

    return "The field is invalid.";
  }

  const onSettingsClick = () => {
    setIsMenuShown(!isMenuShown);
  }
  const onSubmit = (config: GameConfig) => {
    props.onConfigChanged(config);
    setIsMenuShown(false);
  }

  return (
    <nav className="menu">
      <button className="button" onClick={onSettingsClick}>Settings</button>

      {isMenuShown && <form ref={menu} className="config-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="form-input">
          <label className="form-input__label" htmlFor="width">Width</label>
          <input type="number"
                 defaultValue={props.config.width}
                 {...register("width", {...VALIDATORS.width, valueAsNumber: true})}
                 aria-invalid={errors.width ? "true" : "false"}
          />
          {errors.width && <span className="form-input__error" role="alert">{getErrorMessage(errors.width)}</span>}
        </div>
        <div className="form-input">
          <label className="form-input__label" htmlFor="height">Height</label>
          <input type="number"
                 defaultValue={props.config.height}
                 {...register("height", {...VALIDATORS.height, valueAsNumber: true})}
                 aria-invalid={errors.height ? "true" : "false"}
          />
          {errors.height && <span className="form-input__error" role="alert">{getErrorMessage(errors.height)}</span>}
        </div>
        <div className="form-input">
          <label className="form-input__label" htmlFor="bombs">Bombs</label>
          <input type="number"
                 defaultValue={props.config.bombs}
                 {...register("bombs", { ...VALIDATORS.bombs, validate: () => getValues("bombs") < getValues("width") * getValues("height")? true: `The field should be less than ${getValues("width") * getValues("height")}`, valueAsNumber: true })}
                 aria-invalid={errors.bombs ? "true" : "false"}
          />
          {errors.bombs && <span className="form-input__error" role="alert">{getErrorMessage(errors.bombs)}</span>}
        </div>
        <button className="button" type="submit"> New Game </button>
      </form>}
    </nav>
  )
}

export default Menu;
