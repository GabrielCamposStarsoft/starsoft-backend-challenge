import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import type { Repository } from 'typeorm';
import { SaleEntity } from '../../../sales/entities';
import { SessionEntity } from '../../entities';
import { DeleteSessionUseCase } from '../delete-sessions.use-case';

describe('DeleteSessionUseCase', () => {
  let useCase: DeleteSessionUseCase;
  let sessionRepository: jest.Mocked<
    Pick<Repository<SessionEntity>, 'findOne' | 'delete'>
  >;
  let salesRepository: jest.Mocked<Pick<Repository<SaleEntity>, 'count'>>;
  let i18nService: jest.Mocked<Pick<I18nService, 't'>>;

  const sessionId = 'session-1';
  const mockSession = { id: sessionId } as SessionEntity;

  beforeEach(async () => {
    const mockSessionRepo = {
      findOne: jest.fn(),
      delete: jest.fn(),
    };

    const mockSalesRepo = {
      count: jest.fn(),
    };

    const mockI18n = {
      t: jest.fn().mockReturnValue('Session not found'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteSessionUseCase,
        {
          provide: getRepositoryToken(SessionEntity),
          useValue: mockSessionRepo,
        },
        {
          provide: getRepositoryToken(SaleEntity),
          useValue: mockSalesRepo,
        },
        {
          provide: I18nService,
          useValue: mockI18n,
        },
      ],
    }).compile();

    useCase = module.get(DeleteSessionUseCase);
    sessionRepository = module.get(getRepositoryToken(SessionEntity));
    salesRepository = module.get(getRepositoryToken(SaleEntity));
    i18nService = module.get(I18nService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should delete a session when it exists and has no sales', async () => {
      sessionRepository.findOne.mockResolvedValue(mockSession);
      salesRepository.count.mockResolvedValue(0);
      sessionRepository.delete.mockResolvedValue({ affected: 1 } as never);

      await useCase.execute({ id: sessionId });

      expect(sessionRepository.findOne).toHaveBeenCalledWith({
        where: { id: sessionId },
      });
      expect(salesRepository.count).toHaveBeenCalledWith({
        where: { sessionId },
      });
      expect(sessionRepository.delete).toHaveBeenCalledWith(sessionId);
    });

    it('should throw ConflictException when session has confirmed sales', async () => {
      sessionRepository.findOne.mockResolvedValue(mockSession);
      salesRepository.count.mockResolvedValue(3);
      i18nService.t.mockReturnValue('Cannot delete: has 3 sales');

      await expect(useCase.execute({ id: sessionId })).rejects.toThrow(
        ConflictException,
      );

      expect(salesRepository.count).toHaveBeenCalledWith({
        where: { sessionId },
      });
      expect(i18nService.t).toHaveBeenCalledWith(
        'common.session.cannotDeleteWithSales',
        { args: { id: sessionId, count: 3 } },
      );
      expect(sessionRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when session does not exist', async () => {
      sessionRepository.findOne.mockResolvedValue(null);

      await expect(useCase.execute({ id: 'non-existent-id' })).rejects.toThrow(
        NotFoundException,
      );

      expect(i18nService.t).toHaveBeenCalledWith(
        'common.session.notFoundWithId',
        { args: { id: 'non-existent-id' } },
      );
      expect(sessionRepository.delete).not.toHaveBeenCalled();
    });
  });
});
