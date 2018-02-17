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

let preloadedState: IAppState | undefined;
if (typeof window === "object") {
    preloadedState = (window as any).__PRELOADED_STATE__;
    delete (window as any).__PRELOADED_STATE__;
}

export default create(preloadedState);
