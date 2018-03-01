export enum Gender {
    Female = "female",
    Male = "male",
    Genderless = "genderless",
}

export enum HatchRate {
    Hatched = "hatched",
    Soon = "soon",
    Close = "close",
    Wait = "wait",
}

export interface IPokemon {
    id: string;
    gender: Gender;
    lostHp: number;
    experience: number;
    level: number;
    isEgg: boolean;
    isShiny: boolean;
    trainerId: string;
    nickname: string | null;
    originalTrainerId: string;
    displayOT: string | null;
    meetLevel: number | null;
    meetPlaceIndex: string | null;
    meetDate: Date | null;
    birthDate: Date | null;
    mother: string;
    father: string;
    tradable: boolean;
    pokemonCenter: Date | null;
}
