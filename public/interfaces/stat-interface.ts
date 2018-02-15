export interface IStat {
    hp: number;
    attack: number;
    defense: number;
    "special-attack": number;
    "special-defense": number;
    speed: number;
}

export type IOptionalStat = Partial<IStat>;
export type IImmutableStat = Readonly<IStat>;

export interface IPokemonStat extends IImmutableStat {
    readonly maxHp: number;
}

export type StatName = keyof IStat;

export const statNames: ReadonlyArray<StatName> = [
    "hp", "attack", "defense", "special-attack", "special-defense", "speed",
];
