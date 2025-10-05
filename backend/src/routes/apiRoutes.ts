import { Request, Response, Router } from 'express';
import { DummyLokasi } from '../data/dummy/dummyData';
import { DeviceData } from '../types/deviceData';

export function createApiRoutes(getStatus: () => string, getLatest: () => DeviceData | null) {
    const router = Router();

    router.get('/dummy', (_req: Request, res: Response) => res.json(DummyLokasi));

    router.get('/status', (_req: Request, res: Response) => {
        res.json({
            status: getStatus(),
            hasData: getLatest() !== null,
        });
    });

    router.get('/latest-data', (_req: Request, res: Response) => {
        const data = getLatest();
        if (data) res.json(data);
        else res.status(404).json({ message: 'No device data available yet.' });
    });

    return router;
}
