import { BattleResult } from "./battle-interface";

export interface IProfile {
    provider: string;
    id: string;
    displayName: string;
}

export interface ITrainerPublic {
    id: string;
    name: string;
    pokedexCaughtNum: number;
    pokedexSeenNum: number;
    acceptBattle: boolean;
    statistics: {
        battleTime: number;
        battleWin: number;
        tradeTime: number;
        catchTime: number;
        hatchTime: number;
        evolveTime: number;
        cost: number;
    };
    lastLogin: Date;
    todayLuck: number | null;
    battlePoint: number;
}

export interface ITrainerPrivate extends ITrainerPublic {
    encounter: {
        location: string;
        area: string;
        method: string;
        battleResult: BattleResult;
    } | null;
    encounterPokemon: string | null;
    battlePokemon: string | null;
    realworld: {
        longitude: number;
        latitude: number;
        countryCode: string;
        timezoneId: string;
    };
    language: string;
    profile: IProfile;
}

export type TimeOfDay = "morning" | "day" | "night";
