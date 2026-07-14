import { Router } from 'express';
import { scrapePlaces } from '../controllers/scrapeController.js';

export const scrapeRouter = Router();

scrapeRouter.post('/scrape', scrapePlaces);
