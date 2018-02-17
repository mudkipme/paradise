import { combineReducers } from "redux";
import config, { IConfigState } from "./config";
import profile, { IProfileState } from "./profile";

export interface IAppState {
    config: IConfigState;
    profile: IProfileState;
}

export default combineReducers<IAppState>({
    config,
    profile,
});
