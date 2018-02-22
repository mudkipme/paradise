import { DataTypes } from "sequelize";
import { sequelize } from "../lib/database";
import Pokemon from "./pokemon";
import Trainer from "./trainer";

export { Pokemon, Trainer };

Pokemon.belongsTo(Trainer, { as: "trainer" });
Pokemon.belongsTo(Trainer, { as: "originalTrainer" });

const TrainerParty = sequelize.define("trainerParty", {
    position: DataTypes.INTEGER,
});
Trainer.belongsToMany(Pokemon, { as: "party", through: TrainerParty });

const TrainerStorage = sequelize.define("trainerStorage", {
    boxId: DataTypes.INTEGER,
    position: DataTypes.INTEGER,
});
Trainer.belongsToMany(Pokemon, { as: "storagePokemon", through: TrainerStorage });

Trainer.belongsTo(Pokemon, { as: "encounterPokemon", constraints: false });
Trainer.belongsTo(Pokemon, { as: "battlePokemon", constraints: false });
