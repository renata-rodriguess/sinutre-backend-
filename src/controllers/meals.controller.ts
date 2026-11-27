import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { MEAL_CHOICES } from '../constants/enums';

export async function meals(req: Request, res: Response) {
  const meals = await prisma.meal.findMany({
    where: { userId: req.userId },
    include: {
      foods: {
        include: {
          food: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const result = meals.map((meal) => {
    const totals = meal.foods.reduce(
      (acc, item) => {
        const factor = item.foodG / 100;

        acc.grams += item.foodG;
        acc.calories += item.food.caloriesPer100g * factor;
        acc.carbs += item.food.carbsPer100g * factor;
        acc.proteins += item.food.proteinPer100g * factor;
        acc.fats += item.food.fatPer100g * factor;

        return acc;
      },
      { grams: 0, calories: 0, carbs: 0, proteins: 0, fats: 0 },
    );

    return {
      id: meal.id,
      name: meal.description,
      type: meal.type,
      createdAt: meal.createdAt,
      eatTime: meal.eatTime,
      totals,
      items: meal.foods,
    };
  });

  return res.json(result);
}

export async function createMeal(req: Request, res: Response) {
  const userId = req.userId!;
  const { type, eatTime, description, items } = req.body;

  const validType =
    typeof type === 'string' &&
    MEAL_CHOICES.includes(type as typeof MEAL_CHOICES[number]);

  const mealDate = new Date(eatTime);

  const validItems =
    Array.isArray(items) &&
    items.length > 0 &&
    items.every(
      (item: { name?: string; grams?: unknown }) =>
        typeof item.grams === 'number' &&
        Number.isFinite(item.grams) &&
        item.grams > 0,
    );

  if (
    !validType ||
    typeof eatTime !== 'string' ||
    Number.isNaN(mealDate.getTime()) ||
    typeof description !== 'string' ||
    !description.trim() ||
    !validItems
  ) {
    return res.status(400).json({
      message:
        'Informe corretamente o tipo, a data, a descrição e os alimentos da refeição.',
    });
  }

  const meal = await prisma.$transaction(
    async (tx) => {
      const mealFoodData = [];

      for (const item of items) {
        const foodName = item.name || 'Alimento';
        const grams = Number(item.grams);

        const calories = Number(item.calories) || grams * 1.5;
        const carbs = Number(item.carbs) || grams * 0.2;
        const protein = Number(item.proteins) || grams * 0.1;
        const fat = Number(item.fats) || grams * 0.05;

        let foodRecord = await tx.food.findFirst({
          where: { name: foodName, userId },
        });

        if (!foodRecord) {
          foodRecord = await tx.food.create({
            data: {
              name: foodName,
              userId,
              caloriesPer100g: (calories / grams) * 100,
              carbsPer100g: (carbs / grams) * 100,
              proteinPer100g: (protein / grams) * 100,
              fatPer100g: (fat / grams) * 100,
            },
          });
        }

        mealFoodData.push({
          foodId: foodRecord.id,
          foodG: grams,
          calories,
          carbs,
          protein,
          fat,
        });
      }

      const newMeal = await tx.meal.create({
        data: {
          type,
          eatTime: mealDate,
          description: description.trim(),
          userId,
        },
      });

      await tx.mealFood.createMany({
        data: mealFoodData.map((mfd) => ({
          mealId: newMeal.id,
          ...mfd,
        })),
      });

      return newMeal;
    },
    {
      maxWait: 10000,
      timeout: 20000,
    },
  );

  return res.status(201).json(meal);
}

export async function dailySummary(req: Request, res: Response) {
  const userId = req.userId!;
  const date = String(
    req.query.date ?? new Date().toISOString().slice(0, 10),
  );
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

  const start = new Date(localDate.getTime() + timezoneOffset * 60000);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const [healthData, meals] = await Promise.all([
    prisma.healthData.findFirst({
      where: { userId, isActive: true },
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
      orderBy: { eatTime: 'asc' },
    }),
  ]);

  const consumedCalories = meals.reduce(
    (total, meal) =>
      total + meal.foods.reduce((sum, item) => sum + item.calories, 0),
    0,
  );

  const goal = healthData?.targetDietDaily ?? null;

  return res.json({
    date,
    goal,
    consumedCalories,
    remainingCalories:
      goal === null ? null : Math.max(goal - consumedCalories, 0),
    exceeded: goal === null ? false : consumedCalories > goal,
    mealsCount: meals.length,
  });
}

export async function deleteMeal(req: Request, res: Response) {
  const userId = req.userId!;
  const mealId = Number(req.params.id);

  if (Number.isNaN(mealId)) {
    return res.status(400).json({ message: 'ID da refeição inválido.' });
  }

  try {
    const meal = await prisma.meal.findFirst({
      where: { id: mealId, userId },
    });

    if (!meal) {
      return res.status(404).json({ message: 'Refeição não encontrada.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.mealFood.deleteMany({
        where: { mealId },
      });

      await tx.meal.delete({
        where: { id: mealId },
      });
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao apagar refeição:', error);
    return res.status(500).json({ message: 'Não foi possível apagar a refeição.' });
  }
}
