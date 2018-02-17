import { AppAction } from "../actions";
import { ProfileActionType } from "../actions/profile";
import { IProfile } from "../interfaces/profile-interface";

export interface IProfileState extends IProfile {
    hasLogin: boolean;
}

const initialState: IProfileState = {
    displayName: "",
    hasLogin: false,
    id: 0,
    provider: "",
};

export default function profile(state: IProfileState = initialState, action: AppAction) {
    switch (action.type) {
        case ProfileActionType.LOGGED_IN:
            return {
                ...state,
                displayName: action.payload.displayName,
                hasLogin: true,
                id: action.payload.id,
                provider: action.payload.provider,
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
