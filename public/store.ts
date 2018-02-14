import { applyMiddleware, createStore } from "redux";
import promiseMiddleware from "redux-promise-middleware";
import reducers from "./reducers";

export const create = () => createStore(reducers, {}, applyMiddleware(
    promiseMiddleware(),
));
export default create();
