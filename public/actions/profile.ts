import { ITrainerPrivate } from "../interfaces/trainer-interface";

export enum ProfileActionType {
    LOGGED_IN = "PROFILE_LOGGED_IN",
    LOGGED_OUT = "PROFILE_LOGGED_OUT",
}

export interface IProfileLoggedInAction {
    type: ProfileActionType.LOGGED_IN;
    payload: ITrainerPrivate;
}

export interface IProfileLoggedOutAction {
    type: ProfileActionType.LOGGED_OUT;
}

export type ProfileAction = IProfileLoggedInAction | IProfileLoggedOutAction;

export const profileLoggedIn: (me: ITrainerPrivate) => IProfileLoggedInAction = (me) => ({
    payload: me,
    type: ProfileActionType.LOGGED_IN,
});

export const profileLoggedOut: () => IProfileLoggedOutAction = () => ({
    type: ProfileActionType.LOGGED_OUT,
});
