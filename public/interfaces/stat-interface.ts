export enum StatName {
    hp = "hp",
    attack = "attack",
    defense = "defense",
    "special-attack" = "special-attack",
    "special-defense" = "special-defense",
    speed = "speed",
}

export type IStat = Record<StatName, number>;
export type IOptionalStat = Partial<IStat>;
export type IImmutableStat = Readonly<IStat>;

export interface IPokemonStat extends IImmutableStat {
    readonly maxHp: number;
}
