import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { prisma } from '../prisma';

export const foodRouter = Router();

foodRouter.get('/', requireAuth, async (req, res) => {
  const search = String(req.query.search ?? '');

  const foods = await prisma.food.findMany({
    where: {
      userId: req.userId!,
      name: {
        contains: search,
        mode: 'insensitive',
      },
    },
    take: 10,
    orderBy: {
      name: 'asc',
    },
  });

  return res.json(foods);
});

foodRouter.post('/', requireAuth, async (req, res) => {
  const {
    name,
    caloriesPer100g,
    carbsPer100g,
    proteinPer100g,
    fatPer100g,
  } = req.body;

  if (req.userId === undefined) {
    return res.sendStatus(401);
  }

  const values = [
    caloriesPer100g,
    carbsPer100g,
    proteinPer100g,
    fatPer100g,
  ];

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    !values.every(
      (value) =>
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= 0,
    )
  ) {
    return res.status(400).json({
      message: 'Informe os dados do alimento corretamente.',
    });
  }

  const food = await prisma.food.create({
    data: {
      name: name.trim(),
      caloriesPer100g,
      carbsPer100g,
      proteinPer100g,
      fatPer100g,
      userId: req.userId,
    },
  });

  return res.status(201).json(food);
});

foodRouter.put('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'Identificador do alimento inválido.',
    });
  }

  const {
    name,
    caloriesPer100g,
    carbsPer100g,
    proteinPer100g,
    fatPer100g,
  } = req.body;

  const values = [
    caloriesPer100g,
    carbsPer100g,
    proteinPer100g,
    fatPer100g,
  ];

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    !values.every(
      (value) =>
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= 0,
    )
  ) {
    return res.status(400).json({
      message: 'Informe os dados do alimento corretamente.',
    });
  }

  const result = await prisma.food.updateMany({
    where: {
      id,
      userId: req.userId!,
    },
    data: {
      name: name.trim(),
      caloriesPer100g,
      carbsPer100g,
      proteinPer100g,
      fatPer100g,
    },
  });

  if (result.count === 0) {
    return res.status(404).json({
      message: 'Alimento não encontrado.',
    });
  }

  const food = await prisma.food.findUnique({
    where: {
      id,
    },
  });

  return res.json(food);
});

foodRouter.delete('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'Identificador do alimento inválido.',
    });
  }

  const food = await prisma.food.findFirst({
    where: {
      id,
      userId: req.userId!,
    },
  });

  if (!food) {
    return res.status(404).json({
      message: 'Alimento não encontrado.',
    });
  }

  const usedInMeals = await prisma.mealFood.count({
    where: {
      foodId: id,
    },
  });

  if (usedInMeals > 0) {
    return res.status(409).json({
      message: 'Não é possível excluir um alimento que já foi utilizado em refeições.',
    });
  }

  await prisma.food.delete({
    where: {
      id,
    },
  });

  return res.sendStatus(204);
});