import { AppAction } from "../actions";
import { ProfileActionType } from "../actions/profile";
import { ITrainerPrivate } from "../interfaces/trainer-interface";

export interface IProfileState {
    hasLogin: boolean;
    me: ITrainerPrivate | null;
}

const initialState: IProfileState = {
    hasLogin: false,
    me: null,
};

export default function profile(state: IProfileState = initialState, action: AppAction) {
    switch (action.type) {
        case ProfileActionType.LOGGED_IN:
            return {
                ...state,
                me: action.payload,
            };
        case ProfileActionType.LOGGED_OUT:
            return {
                ...state,
                ...initialState,
            };
        default:
            return state;
    }
}
