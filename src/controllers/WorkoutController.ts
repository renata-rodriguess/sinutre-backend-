import { Request, Response } from 'express';
import { prisma } from '../prisma';

export class WorkoutController {
  async getToday(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const workout = await prisma.workout.findFirst({
        where: {
          userId: Number(userId),
          createdAt: {
            gte: today,
          },
        },
      });

      return res.json({ completed: !!workout });
    } catch (error) {
      console.error('Erro ao buscar treino:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async toggle(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingWorkout = await prisma.workout.findFirst({
        where: {
          userId: Number(userId),
          createdAt: {
            gte: today,
          },
        },
      });

      if (existingWorkout) {

        await prisma.workout.delete({
          where: { id: existingWorkout.id },
        });
        return res.json({ completed: false });
      } else {

        await prisma.workout.create({
          data: {
            userId: Number(userId),
            completed: true,
          },
        });
        return res.json({ completed: true });
      }
    } catch (error) {
      console.error('Erro ao registrar treino:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}