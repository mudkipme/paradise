import Sequelize from "sequelize";
import PokemonSchema, { setupRelation as setupPokemonRelation } from "../models/pokemon";
import TrainerSchema, { setupRelation as setupTrainerRelation } from "../models/trainer";
import nconf from "./config";

export const sequelize = new Sequelize(
    nconf.get("database:postgres:database"),
    nconf.get("database:postgres:username"),
    nconf.get("database:postgres:password"),
    {
        dialect: "postgres",
        host: nconf.get("database:postgres:host"),
        logging: process.env.NODE_ENV === "production" ? false : console.log,
        operatorsAliases: false,
    },
);

export const models = {
    Pokemon: PokemonSchema(sequelize, Sequelize),
    Trainer: TrainerSchema(sequelize, Sequelize),
};

export type Models = typeof models;

export type Getters<T, I> = {
    [P in keyof T]: () => T[P]
} & ThisType<I>;

export type InstanceMethods<T, I> = T & ThisType<I>;

const setups = [setupPokemonRelation, setupTrainerRelation];
for (const setup of setups) {
    setup(models, sequelize, Sequelize);
}
