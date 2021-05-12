import findYarnWorkspaceRoot from 'find-yarn-workspace-root';
import convict from 'convict';
import path from 'path';

const config = convict({
  app: {
    secret: {
      doc: 'Secret of Paradise app',
      format: String,
      default: '',
      env: 'PARADISE_SECRET',
    },
    host: {
      doc: 'Server host',
      format: String,
      default: '0.0.0.0',
    },
    port: {
      doc: 'Server port',
      format: 'int',
      default: 4000,
    },
    url: {
      doc: 'Project url',
      format: String,
      default: 'http://localhost:4000',
    },
    prefix: {
      doc: 'Prefix for sessions',
      format: String,
      default: 'paradise',
    },
    pokemonCenterHP: {
      doc: 'Pokémon Center recover HP per hour',
      format: Number,
      default: 10,
    },
    hatchCycleHour: {
      doc: 'Hatch cycle',
      format: Number,
      default: 1,
    },
  },
  redis: {
    host: {
      doc: 'Redis host',
      format: String,
      default: 'redis',
    },
    port: {
      doc: 'Redis port',
      format: 'int',
      default: 6379,
    },
  },
  auth: {
    github: {
      enabled: {
        doc: 'Enable GitHub login',
        format: Boolean,
        default: false,
      },
      clientId: {
        doc: 'GitHub Client ID',
        format: String,
        default: '',
        env: 'GITHUB_CLIENT_ID',
      },
      clientSecret: {
        doc: 'GitHub Client Secret',
        format: String,
        default: '',
        env: 'GITHUB_CLIENT_SECRET',
      },
    },
  },
  pokeapi: {
    cacheLimit: {
      doc: 'PokéAPI cache limit',
      format: Number,
      default: 3600000,
    },
    hostname: {
      doc: 'PokéAPI hostname',
      format: String,
      default: '://pokeapi.co',
    },
  },
  thirdParty: {
    geonames: {
      doc: 'GeoNames API Username',
      format: String,
      default: 'example',
    },
  },
});

config.loadFile(path.join(findYarnWorkspaceRoot() ?? '', 'config.json'));

export type Config = typeof config;

export default config;
