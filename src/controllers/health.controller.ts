import { Request, Response } from 'express';
import { prisma } from '../prisma';

export class HealthController {
  async getHealth(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const latestWeight = await prisma.weightLog.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const activeHealth = await prisma.healthData.findFirst({
        where: { userId, isActive: true },
      });

      return res.status(200).json({
        weight: latestWeight?.weight || null,
        height: latestWeight?.height || null,
        calorieGoal: activeHealth?.targetDietDaily || null,
        levelActivity: activeHealth?.levelActivity || null,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async saveHealthData(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { weight, height, calorieGoal, levelActivity } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      let parsedHeight = Number(height);
      if (isNaN(parsedHeight) || parsedHeight <= 0) {
        return res.status(400).json({ error: 'Altura inválida' });
      }

      const parsedWeight = Number(weight);
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        return res.status(400).json({ error: 'Peso inválido' });
      }

      const parsedCalorieGoal = calorieGoal ? Number(calorieGoal) : 2000;

      await prisma.weightLog.create({
        data: {
          userId,
          weight: parsedWeight,
          height: parsedHeight,
        },
      });

      await prisma.healthData.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });

      const healthData = await prisma.healthData.create({
        data: {
          userId,
          targetDietDaily: parsedCalorieGoal,
          levelActivity: levelActivity || 'MODERADO',
          isActive: true,
        },
      });

      return res.status(200).json({
        message: 'Dados de saúde salvos com sucesso!',
        healthData,
        weight: parsedWeight,
        height: parsedHeight,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao salvar dados de saúde' });
    }
  }
}