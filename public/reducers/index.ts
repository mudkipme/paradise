import { combineReducers } from "redux";
import profile, { IProfileState } from "./profile";

export interface IAppState {
    profile: IProfileState;
}

export default combineReducers<IAppState>({
    profile,
});
