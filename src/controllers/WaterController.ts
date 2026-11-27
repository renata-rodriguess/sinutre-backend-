import { Request, Response } from 'express';
import { prisma } from '../prisma';

export class WaterController {
  async getToday(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const records = await prisma.waterIntake.findMany({
        where: {
          userId: Number(userId),
          createdAt: {
            gte: today,
          },
        },
      });

      const total = records.reduce((acc: number, item: any) => acc + item.amount, 0);

      return res.json({ total });
    } catch (error) {
      console.error('Erro ao buscar água:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { amount } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const waterIntake = await prisma.waterIntake.create({
        data: {
          userId: Number(userId),
          amount: Number(amount),
        },
      });

      return res.status(201).json(waterIntake);
    } catch (error) {
      console.error('Erro ao registrar água:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}