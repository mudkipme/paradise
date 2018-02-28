export enum StatName {
    hp = "hp",
    attack = "attack",
    defense = "defense",
    "special-attack" = "special-attack",
    "special-defense" = "special-defense",
    speed = "speed",
}

export type IStat = Record<StatName, number>;

export interface IPokemonStat extends IStat {
    maxHp: number;
}
