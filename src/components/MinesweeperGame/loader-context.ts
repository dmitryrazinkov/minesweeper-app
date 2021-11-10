//Context for showing loading wheel (for ex., when a board is generating)
import {createContext} from "react";

export const LoaderContext = createContext({
  isLoading: false,
  show: () => { },
  hide: () => { }
});
