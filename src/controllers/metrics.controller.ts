import { Request, Response } from 'express';
import { prisma } from '../prisma';

export async function getMetrics(req: Request, res: Response) {
  const userId = req.userId!;
  const date = String(req.query.date ?? new Date().toISOString().slice(0, 10));
  const timezoneOffset = Number(req.query.timezoneOffset ?? 0);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isInteger(timezoneOffset) ||
    timezoneOffset < -840 ||
    timezoneOffset > 840
  ) {
    return res.status(400).json({
      message: 'Data ou fuso horário inválido.',
    });
  }

  const [year, month, day] = date.split('-').map(Number);
  const localDate = new Date(Date.UTC(year, month - 1, day));

  if (
    localDate.getUTCFullYear() !== year ||
    localDate.getUTCMonth() !== month - 1 ||
    localDate.getUTCDate() !== day
  ) {
    return res.status(400).json({
      message: 'Data inválida.',
    });
  }

  const end = new Date(
    localDate.getTime() + timezoneOffset * 60000 + 24 * 60 * 60 * 1000,
  );

  const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [weightLog, meals] = await Promise.all([
    prisma.weightLog.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.meal.findMany({
      where: {
        userId,
        eatTime: {
          gte: start,
          lt: end,
        },
      },
      include: {
        foods: true,
      },
    }),
  ]);

  let bmi: number | null = null;
  let classification: string | null = null;

  if (weightLog && weightLog.height > 0) {
    bmi = Number(
      (weightLog.weight / (weightLog.height * weightLog.height)).toFixed(2),
    );

    if (bmi < 18.5) {
      classification = 'Abaixo do peso';
    } else if (bmi < 25) {
      classification = 'Peso adequado';
    } else if (bmi < 30) {
      classification = 'Sobrepeso';
    } else if (bmi < 35) {
      classification = 'Obesidade grau I';
    } else if (bmi < 40) {
      classification = 'Obesidade grau II';
    } else {
      classification = 'Obesidade grau III';
    }
  }

  const totalCalories = meals.reduce(
    (total, meal) =>
      total + meal.foods.reduce((sum, item) => sum + item.calories, 0),
    0,
  );

  const averageCalories = Number((totalCalories / 7).toFixed(2));

  return res.json({
    bmi,
    classification,
    weight: weightLog?.weight ?? null,
    height: weightLog?.height ?? null,
    averageCaloriesLast7Days: averageCalories,
    periodDays: 7,
  });
}
