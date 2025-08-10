import { NotFoundException } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { query } from 'common/db';

jest.mock('common/db', () => ({ query: jest.fn() }));

const mockedQuery = query as jest.MockedFunction<typeof query>;

describe('SessionsService', () => {
  let service: SessionsService;

  beforeEach(() => {
    mockedQuery.mockReset();
    service = new SessionsService();
  });

  it('creates a session when client exists', async () => {
    const clientId = 'client1';
    mockedQuery
      .mockResolvedValueOnce({ rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ id: 'sess1', client_id: clientId, created_at: new Date() }] } as any);

    const result = await service.create({ client_id: clientId });

    expect(mockedQuery).toHaveBeenCalledTimes(2);
    expect(result.client_id).toBe(clientId);
  });

  it('throws when client missing', async () => {
    mockedQuery.mockResolvedValueOnce({ rowCount: 0 } as any);
    await expect(service.create({ client_id: 'nope' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('gets a session', async () => {
    const session = { id: '1', client_id: 'c', created_at: new Date() };
    mockedQuery.mockResolvedValueOnce({ rows: [session] } as any);
    await expect(service.get('1')).resolves.toEqual(session);
  });

  it('lists sessions by client', async () => {
    const sessions = [{ id: '1', client_id: 'c', created_at: new Date() }];
    mockedQuery.mockResolvedValueOnce({ rows: sessions } as any);
    await expect(service.listByClient('c')).resolves.toEqual(sessions);
  });
});

