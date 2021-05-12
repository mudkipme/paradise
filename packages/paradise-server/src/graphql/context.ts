import { Cradle } from 'fastify-awilix';
import { MercuriusContext } from 'mercurius';

export type Context = MercuriusContext & {
  cradle: Cradle;
  trainerId?: string;
};
