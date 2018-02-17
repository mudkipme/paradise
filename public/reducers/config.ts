import { AppAction } from "../actions";

export interface IConfigState {
    loginStrategies: string[];
}

const initialState: IConfigState = {
    loginStrategies: [],
};

export default function config(state: IConfigState = initialState, action: AppAction) {
    return state;
}
