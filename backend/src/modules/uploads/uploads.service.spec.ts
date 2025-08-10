import { UploadsService } from './uploads.service';
import { query } from 'common/db';

jest.mock('common/db', () => ({ query: jest.fn() }));

const mockedQuery = query as jest.MockedFunction<typeof query>;

describe('UploadsService', () => {
  let storage: { presignedPutObject: jest.Mock };
  let service: UploadsService;

  beforeEach(() => {
    storage = { presignedPutObject: jest.fn() };
    service = new UploadsService(storage as any);
    mockedQuery.mockReset();
  });

  it('presigns uploads and records db entry', async () => {
    storage.presignedPutObject.mockResolvedValue('signed');
    mockedQuery.mockResolvedValue({ rows: [{ id: 'u1' }] } as any);

    const res = await service.presign({
      kind: 'image',
      mime: 'image/png',
      bytes: 100,
      sessionId: 's1',
      clientId: 'c1',
    });

    expect(storage.presignedPutObject).toHaveBeenCalled();
    expect(mockedQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO uploads'),
      expect.any(Array),
    );
    expect(res).toEqual({ uploadId: 'u1', uploadUrl: 'signed', key: expect.any(String) });
  });
});

