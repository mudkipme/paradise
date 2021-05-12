import { PrismaClient, Trainer } from '@mudkipme/paradise-prisma';
import Redlock from 'redlock';
import { random, range } from 'lodash';
import { toDate } from 'date-fns-tz';
import { isSameDay, getHours } from 'date-fns';
import SunCalc from 'suncalc';
import { Item } from 'pokedex-promise-v2';
import { ProviderUser } from '../services/auth';
import { SpeciesService } from './species';
import { TrainerRealWorld } from '../generated/graphql';
import { Geode } from '../services/geo';
import error, { ErrorMessage } from '../services/error';

export const defaultStatistics = {
  battleTime: 0,
  battleWin: 0,
  tradeTime: 0,
  catchTime: 0,
  hatchTime: 0,
  evolveTime: 0,
  cost: 0,
};

export type Bag = Array<{
  itemId: number;
  number: number;
}>;

export default function trainerService(
  database: PrismaClient,
  redlock: Redlock,
  speciesService: SpeciesService,
  geode: Geode,
) {
  const findOrCreateTrainer = async ({
    provider, id, name, user,
  }: ProviderUser) => {
    const lock = await redlock.lock(`loadTrainer:${provider}:${id}`, 5000);

    try {
      let trainer = await database.trainerProvider.findUnique({
        where: { provider_id: { provider, id: `${id}` } },
      }).trainer();

      if (!trainer) {
        trainer = await database.trainer.create({
          data: {
            name,
            providers: { create: { provider, id: `${id}`, user } },
          },
        });
      } else {
        await database.trainer.update({
          where: { id: trainer.id },
          data: { lastLogin: new Date() },
        });
      }

      if (!trainer) {
        throw new Error('FAILED_TO_CREATE_TRAINER');
      }

      return trainer;
    } finally {
      await lock.unlock();
    }
  };

  const trainerWithParty = async (id: string) => {
    const trainer = await database.trainer.findUnique({
      where: { id },
      include: {
        trainerPokemon: {
          where: { boxId: -1 },
          orderBy: { slot: 'asc' },
          include: { pokemon: true },
        },
      },
    });
    if (!trainer) {
      throw new Error('FAILED_TO_GET_TRAINER');
    }
    return trainer;
  };

  const getTrainer = (id: string) => database.trainer.findUnique({ where: { id } });

  const getParty = (id: string) => database.trainer.findUnique({ where: { id } })
    .trainerPokemon({
      where: { boxId: -1 },
      include: { pokemon: true },
      orderBy: { slot: 'asc' },
    });

  const getBox = async (trainerId: string, boxId: number) => database.trainer
    .findUnique({ where: { id: trainerId } })
    .trainerPokemon({
      where: { boxId },
      include: { pokemon: true },
      orderBy: { slot: 'asc' },
    });

  const storageNum = async (trainerId: string) => {
    const query = await database.trainerPokemon.aggregate({
      max: { boxId: true },
      where: { trainerId, boxId: { not: -1 } },
    });
    return Math.max(query.max.boxId ?? 0, 8);
  };

  const localTime = (trainer: Trainer) => {
    const realWorld = trainer.realWorld as TrainerRealWorld | null;
    return toDate(new Date(), { timeZone: realWorld?.timezoneId });
  };

  const timeOfDay = (trainer: Trainer) => {
    const realWorld = trainer.realWorld as TrainerRealWorld | null;
    if (realWorld?.longitude || realWorld?.latitude) {
      const times = SunCalc.getTimes(new Date(), realWorld.latitude, realWorld.longitude);
      const now = Date.now();
      if (now >= times.dawn.getTime() && now <= times.sunriseEnd.getTime()) {
        return 'morning';
      } if (now > times.sunriseEnd.getTime() && now < times.sunsetStart.getTime()) {
        return 'day';
      } if (now >= times.sunsetStart.getTime() && now <= times.nauticalDusk.getTime()) {
        return 'evening';
      }
      return 'night';
    }
    const hours = getHours(localTime(trainer));
    if (hours >= 6 && hours <= 9) {
      return 'morning';
    } if (hours >= 10 && hours <= 16) {
      return 'day';
    } if (hours === 17) {
      return 'evening';
    }
    return 'night';
  };

  // Get today's lucky Pokémon
  const luckSpecies = async (trainer: Trainer) => {
    const realWorld = trainer.realWorld as TrainerRealWorld | null;

    const lastLogin = toDate(trainer.lastLogin, { timeZone: realWorld?.timezoneId });
    const now = localTime(trainer);

    if (isSameDay(lastLogin, now) && trainer.todayLuck) {
      return speciesService.find(trainer.todayLuck);
    }

    const todayLuck = random(1, await speciesService.totalSpecies());
    await database.trainer.update({
      data: { lastLogin: now, todayLuck },
      where: { id: trainer.id },
    });
    return speciesService.find(todayLuck);
  };

  /**
   * Find an empty slot in storage
   */
  const storageSlot = async (trainer: Trainer) => {
    const slots = await database.trainerPokemon.findMany({
      select: { slot: true, boxId: true },
      where: {
        trainerId: trainer.id, boxId: { not: -1 },
      },
    });
    let box: typeof slots = [];

    const boxNumber = await storageNum(trainer.id);

    // the indexes of all boxes from currentBox
    let boxId = range(trainer.currentBox, trainer.currentBox + boxNumber)
      .map((index) => (index % boxNumber))
      .find((id) => {
        // find the box which has empty slot
        const currentBox = slots.filter((slot) => slot.boxId === id);
        if (currentBox.length >= 30) {
          return false;
        }
        box = currentBox;
        return true;
      });

    if (typeof boxId === 'undefined') {
      boxId = boxNumber;
    }

    // find an empty slot in the box
    const boxSlot = range(0, 30).find((pos) => typeof box.find((slot) => slot.slot === pos) === 'undefined')!;

    if (trainer.currentBox !== boxId) {
      await database.trainer.update({
        where: { id: trainer.id },
        data: { currentBox: boxId },
      });
    }

    return {
      boxId,
      boxSlot,
    };
  };

  /**
     * Set real world location based on latitude and longitude
     * @param  {number}   latitude
     * @param  {number}   longitude
     */
  const setLocation = async (trainer: Trainer, latitude: number, longitude: number) => {
    const tz = await geode.timezone({ lat: latitude, lng: longitude });
    if (tz.status) {
      throw new Error(tz.status.message);
    }

    const realWorld: TrainerRealWorld = {
      latitude,
      longitude,
      timezoneId: tz.timezoneId,
      countryCode: tz.countryCode,
    };
    return database.trainer.update({
      where: { id: trainer.id },
      data: { realWorld },
    });
  };

  /**
     * Check whether this trainer has certain item in bag
     */
  const itemNumber = (trainer: Trainer, item: Item) => {
    const bag = trainer.bag as Bag | null;
    const itemBag = bag?.find((entry) => entry.itemId === item.id);
    return itemBag?.number ?? 0;
  };

  /**
     * Add an item to bag
     * @param  {Item}   item
     * @param  {number}   number
     */
  const addItem = async (trainer: Trainer, item: Item, count = 1) => {
    const bag = (trainer.bag as Bag | null) || [];
    const itemBag = bag.find((entry) => entry.itemId === item.id);
    if (!itemBag) {
      bag.push({ itemId: item.id, number: count });
    } else {
      itemBag.number += count;
    }
    await database.trainer.update({
      where: { id: trainer.id },
      data: { bag },
    });
  };

  /**
     * Remove an item from bag
     * @param  {Item}   item
     * @param  {Number}   number
     */
  const removeItem = async (trainer: Trainer, item: Item, count = 1) => {
    let bag = (trainer.bag as Bag | null) || [];
    const itemBag = bag.find((entry) => entry.itemId === item.id);
    if (!itemBag || itemBag.number < count) {
      throw error(ErrorMessage.ItemNotEnough);
    }
    itemBag.number -= count;
    bag = bag.filter((entry) => entry.number > 0);
    await database.trainer.update({
      where: { id: trainer.id },
      data: { bag },
    });
  };

  return {
    findOrCreateTrainer,
    trainerWithParty,
    getTrainer,
    getParty,
    getBox,
    storageNum,
    localTime,
    timeOfDay,
    luckSpecies,
    setLocation,
    itemNumber,
    addItem,
    removeItem,
    storageSlot,
  };
}

export type TrainerService = ReturnType<typeof trainerService>;
