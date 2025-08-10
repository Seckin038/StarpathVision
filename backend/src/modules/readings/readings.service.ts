import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { cfg } from '../../common/config';
import { randomUUID } from 'crypto';

@Injectable()
export class ReadingsService {
  private pool = new Pool({ connectionString: cfg.db.url });

  async create(dto: { method: string; summary: string; full_text: string }) {
    const id = randomUUID();
    await this.pool.query(
      'INSERT INTO readings (id, method, summary, full_text) VALUES ($1, $2, $3, $4)',
      [id, dto.method, dto.summary, dto.full_text],
    );
    return { id, ...dto };
  }

  async get(id: string) {
    const { rows } = await this.pool.query(
      'SELECT id, method, summary, full_text FROM readings WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  }

  async createFromVision(cards: { name: string; orientation: string }[]) {
    const description = cards
      .map((c) => `${c.name} (${c.orientation})`)
      .join(', ');

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Je bent een tarotkaartenlezer. Beantwoord in het Nederlands.',
          },
          {
            role: 'user',
            content:
              `Geef een interpretatie voor de volgende kaarten: ${description}.\n` +
              'Antwoord als JSON met sleutels "summary" en "full_text".',
          },
        ],
      }),
    });

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content ?? '{}';
    let parsed: { summary: string; full_text: string } = {
      summary: '',
      full_text: '',
    };
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed.summary = content;
      parsed.full_text = content;
    }

    return this.create({ method: 'vision', summary: parsed.summary, full_text: parsed.full_text });
  }
}

