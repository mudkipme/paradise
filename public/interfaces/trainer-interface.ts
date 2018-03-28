import { BattleResult } from "./battle-interface";

export interface IProfile {
    provider: string;
    id: string;
    displayName: string;
}

export type TimeOfDay = "morning" | "day" | "evening" | "night";
