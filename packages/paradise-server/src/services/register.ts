import { PrismaClient } from '@mudkipme/paradise-prisma';
import { asFunction, asValue } from 'awilix';
import { diContainer } from 'fastify-awilix';
import IORedis, { Redis } from 'ioredis';
import Pokedex from 'pokedex-promise-v2';
import Redlock from 'redlock';
import pokemonService, { PokemonService } from '../data-service/pokemon';
import speciesService, { SpeciesService } from '../data-service/species';
import trainerService, { TrainerService } from '../data-service/trainer';
import config from './config';
import geode, { Geode } from './geo';

diContainer.register({
  config: asValue(config),
  database: asFunction(() => new PrismaClient({
    log: ['query'],
  })).singleton(),
  redis: asFunction(() => new IORedis({
    ...config.get('redis'),
    keyPrefix: config.get('app.prefix'),
  })).singleton(),
  redlock: asFunction(({ redis }: { redis: Redis }) => new Redlock([redis])).singleton(),
  pokemonService: asFunction(pokemonService).classic().singleton(),
  trainerService: asFunction(trainerService).classic().singleton(),
  speciesService: asFunction(speciesService).classic().singleton(),
  pokedex: asFunction(() => new Pokedex(config.get('pokeapi'))).singleton(),
  geode: asValue(geode),
});

declare module 'fastify-awilix' {
  interface Cradle {
    config: typeof config;
    database: PrismaClient;
    redis: Redis;
    redlock: Redlock;
    pokemonService: PokemonService;
    trainerService: TrainerService;
    speciesService: SpeciesService;
    pokedex: Pokedex;
    geode: Geode;
  }
}
