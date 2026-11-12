import { Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SeekDto, SetSpeedDto, StartSimDto } from './simulation.controller';
import { SimulationService } from './simulation.service';

const errorsFor = async <T extends object>(cls: new () => T, body: object) =>
  (await validate(plainToInstance(cls, body), { whitelist: true })).map(
    (e) => e.property,
  );

describe('simulation DTOs', () => {
  // With whitelist: true an undecorated field is stripped, which used to turn
  // every seek into percent=undefined and crash the backend on the next tick.
  it('keeps a valid seek percent', async () => {
    expect(await errorsFor(SeekDto, { percent: 50 })).toEqual([]);
  });

  it.each([{}, { percent: -1 }, { percent: 101 }, { percent: 'half' }])(
    'rejects seek body %j',
    async (body) => {
      expect(await errorsFor(SeekDto, body)).toEqual(['percent']);
    },
  );

  it('accepts speeds the UI slider can send (1–50)', async () => {
    expect(await errorsFor(SetSpeedDto, { speedMultiplier: 1 })).toEqual([]);
    expect(await errorsFor(SetSpeedDto, { speedMultiplier: 50 })).toEqual([]);
  });

  it.each([{}, { speedMultiplier: 0 }, { speedMultiplier: 51 }])(
    'rejects speed body %j',
    async (body) => {
      expect(await errorsFor(SetSpeedDto, body)).toEqual(['speedMultiplier']);
    },
  );

  it('lets start omit the speed', async () => {
    expect(await errorsFor(StartSimDto, {})).toEqual([]);
  });
});

describe('SimulationService tick', () => {
  const gateway = {
    sendLocationUpdate: jest.fn(),
    sendSimulationComplete: jest.fn(),
  };
  let service: SimulationService;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    service = new SimulationService({} as never, {} as never, gateway as never);
  });

  afterEach(() => {
    service.stopAll();
    jest.restoreAllMocks();
  });

  const addSimulation = (currentIndex: number) => {
    const simulations = (
      service as unknown as { simulations: Map<string, unknown> }
    ).simulations;
    simulations.set('t1', {
      taskId: 't1',
      volunteerId: 'v1',
      volunteerName: 'Test Volunteer',
      points: [
        [50, 24],
        [50.1, 24.1],
      ],
      currentIndex,
      intervalRef: null,
      speedMultiplier: 5,
    });
    return simulations;
  };

  it('stops the simulation instead of throwing when the index is outside the route', () => {
    const simulations = addSimulation(Number.NaN);
    expect(() =>
      (service as unknown as { safeTick(id: string): void }).safeTick('t1'),
    ).not.toThrow();
    expect(simulations.has('t1')).toBe(false);
  });

  it('seeks inside the route bounds', () => {
    addSimulation(0);
    service.seekSimulation('t1', 100);
    expect(service.getStatus()[0].currentIndex).toBe(1);
  });
});
