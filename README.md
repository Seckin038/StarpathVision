# StarpathVision

StarpathVision is a single‑tenant fortune‑telling platform that mixes image
recognition and large language models to produce tarot, coffee and dream
readings. This repository contains a minimal skeleton for both the NestJS
backend and the Next.js frontend.

## Quickstart

### 1. Start infrastructure

```bash
docker compose up -d db redis minio mailhog
```

Create a bucket named `starpathvision` in the MinIO console
(`http://localhost:9001`).

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

The API runs at `http://localhost:4000/v1`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The web app is available at `http://localhost:3000`.

This skeleton contains only stub logic but wires together file uploads,
tarot card recognition and simple explanation panels. See the spec for full
details on the future roadmap.

