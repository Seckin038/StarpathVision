import { Injectable } from '@nestjs/common';

@Injectable()
export class SessionsService {
  async create(dto: any) {
    // TODO: persist session
    return dto;
  }

  async get(id: string) {
    // TODO: fetch session
    return { id };
  }

  async listByClient(clientId: string) {
    // TODO: list sessions for client
    return [];
  }
}

