import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class ClientsService {
  async create(dto: any) {
    // TODO: insert into DB
    return { id: randomUUID(), ...dto };
  }

  async get(id: string) {
    // TODO: fetch from DB
    return { id, first_name: 'Demo', last_name: 'Klant' };
  }
}

