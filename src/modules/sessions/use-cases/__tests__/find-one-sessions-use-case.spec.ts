import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import type { Repository } from 'typeorm';
import { SessionEntity } from '../../entities';
import { FindSessionByIdUseCase } from '../find-one-sessions.use-case';

describe('FindSessionByIdUseCase', () => {
  let useCase: FindSessionByIdUseCase;
  let sessionsRepository: jest.Mocked<
    Pick<Repository<SessionEntity>, 'findOne'>
  >;
  let i18nService: jest.Mocked<Pick<I18nService, 't'>>;

  const mockSession: SessionEntity = {
    id: 'session-uuid',
    movieTitle: 'Inception',
    roomName: 'Room 1',
    startTime: new Date(),
    endTime: new Date(),
    ticketPrice: 25.5,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as SessionEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindSessionByIdUseCase,
        {
          provide: getRepositoryToken(SessionEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key: string) => key),
          },
        },
      ],
    }).compile();

    useCase = module.get(FindSessionByIdUseCase);
    sessionsRepository = module.get(getRepositoryToken(SessionEntity));
    i18nService = module.get(I18nService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return session when found by id', async () => {
      // Arrange
      sessionsRepository.findOne.mockResolvedValue(mockSession);

      // Act
      const result = await useCase.execute({ id: 'session-uuid' });

      // Assert
      expect(result).toEqual(mockSession);
      expect(sessionsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'session-uuid' },
      });
    });

    it('should throw NotFoundException when session is not found', async () => {
      // Arrange
      sessionsRepository.findOne.mockResolvedValue(null);
      i18nService.t.mockReturnValue('Session not found');

      // Act & Assert
      await expect(useCase.execute({ id: 'non-existent-id' })).rejects.toThrow(
        NotFoundException,
      );

      expect(sessionsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      });
      expect(i18nService.t).toHaveBeenCalledWith(
        'common.session.notFoundWithId',
        { args: { id: 'non-existent-id' } },
      );
    });
  });
});
