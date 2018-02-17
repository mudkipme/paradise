import { applyMiddleware, createStore } from "redux";
import promiseMiddleware from "redux-promise-middleware";
import reducers, { IAppState } from "./reducers";

export const create = (preloadState: Partial<IAppState> = {}) => createStore(
    reducers,
    preloadState as IAppState,
    applyMiddleware(
        promiseMiddleware(),
    ),
);

export default create();
