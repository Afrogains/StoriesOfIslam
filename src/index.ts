import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import type { SeedData } from './types';

dotenv.config();

const seedPath = path.resolve(__dirname, '../db/seed.json');
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8')) as SeedData;

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/v1/categories', (_req, res) => {
  res.json(seed.categories);
});

app.get('/v1/figures', (_req, res) => {
  res.json(seed.figures);
});

app.get('/v1/stories', (_req, res) => {
  res.json(seed.stories);
});

app.listen(port, () => {
  process.stdout.write(`listening :${port}\n`);
});
