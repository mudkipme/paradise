import { Sequelize } from "sequelize";
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
