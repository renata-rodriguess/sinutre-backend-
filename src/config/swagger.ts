import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SiNutre API',
      version: '1.0.0',
      description: 'Documentação da API do SiNutre',
    },
    servers: [
      {
        url: 'http://localhost:3333',
      },
    ],
    tags: [
      { name: 'Autenticação' },
      { name: 'Alimentos' },
      { name: 'Refeições' },
      { name: 'Dados de saúde' },
      { name: 'Métricas' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        FoodInput: {
          type: 'object',
          required: [
            'name',
            'caloriesPer100g',
            'carbsPer100g',
            'proteinPer100g',
            'fatPer100g',
          ],
          properties: {
            name: {
              type: 'string',
              example: 'Arroz branco',
            },
            caloriesPer100g: {
              type: 'number',
              minimum: 0,
              example: 130,
            },
            carbsPer100g: {
              type: 'number',
              minimum: 0,
              example: 28,
            },
            proteinPer100g: {
              type: 'number',
              minimum: 0,
              example: 2.7,
            },
            fatPer100g: {
              type: 'number',
              minimum: 0,
              example: 0.3,
            },
          },
        },
        MealInput: {
          type: 'object',
          required: ['type', 'eatTime', 'description', 'items'],
          properties: {
            type: {
              type: 'string',
              example: 'lunch',
              description: 'Tipo da refeição',
            },
            eatTime: {
              type: 'string',
              format: 'date-time',
              example: '2026-11-17T15:00:00.000Z',
            },
            description: {
              type: 'string',
              example: 'Almoço de teste',
            },
            items: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['foodId', 'grams'],
                properties: {
                  foodId: {
                    type: 'integer',
                    example: 2,
                  },
                  grams: {
                    type: 'number',
                    exclusiveMinimum: 0,
                    example: 100,
                  },
                },
              },
            },
          },
        },
        HealthDataInput: {
          type: 'object',
          required: [
            'targetDietDaily',
            'levelActivity',
            'height',
            'weight',
          ],
          properties: {
            targetDietDaily: {
              type: 'number',
              example: 2200,
              description: 'Meta diária de calorias',
            },
            levelActivity: {
              type: 'string',
              example: 'MODERADAMENTE_ATIVO',
              description: 'Nível de atividade física',
            },
            height: {
              type: 'number',
              example: 1.65,
              description: 'Altura em metros',
            },
            weight: {
              type: 'number',
              example: 64,
              description: 'Peso em quilogramas',
            },
          },
        },
      },
    },
    paths: {
      '/auth/github': {
        get: {
          tags: ['Autenticação'],
          summary: 'Iniciar autenticação com GitHub',
          responses: {
            302: {
              description: 'Redirecionamento para o GitHub',
            },
          },
        },
      },
      '/auth/github/callback': {
        get: {
          tags: ['Autenticação'],
          summary: 'Retorno da autenticação do GitHub',
          parameters: [
            {
              name: 'code',
              in: 'query',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            200: {
              description: 'Autenticação realizada',
            },
            401: {
              description: 'Falha na autenticação',
            },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Autenticação'],
          summary: 'Consultar usuário autenticado',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Dados do usuário',
            },
            401: {
              description: 'Não autenticado',
            },
          },
        },
      },
      '/foods': {
        get: {
          tags: ['Alimentos'],
          summary: 'Listar alimentos',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'search',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            200: {
              description: 'Lista de alimentos',
            },
            401: {
              description: 'Não autenticado',
            },
          },
        },
        post: {
          tags: ['Alimentos'],
          summary: 'Cadastrar alimento',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/FoodInput',
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Alimento cadastrado',
            },
            400: {
              description: 'Dados do alimento inválidos',
            },
            401: {
              description: 'Não autenticado',
            },
          },
        },
      },
      '/foods/{id}': {
        put: {
          tags: ['Alimentos'],
          summary: 'Atualizar alimento',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'integer',
              },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/FoodInput',
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Alimento atualizado',
            },
            400: {
              description: 'Dados inválidos',
            },
            401: {
              description: 'Não autenticado',
            },
            404: {
              description: 'Alimento não encontrado',
            },
          },
        },
        delete: {
          tags: ['Alimentos'],
          summary: 'Excluir alimento',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'integer',
              },
            },
          ],
          responses: {
            204: {
              description: 'Alimento excluído',
            },
            401: {
              description: 'Não autenticado',
            },
            404: {
              description: 'Alimento não encontrado',
            },
            409: {
              description: 'Alimento utilizado em uma refeição',
            },
          },
        },
      },
      '/meals': {
        get: {
          tags: ['Refeições'],
          summary: 'Listar refeições',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Lista de refeições',
            },
            401: {
              description: 'Não autenticado',
            },
          },
        },
        post: {
          tags: ['Refeições'],
          summary: 'Cadastrar refeição',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/MealInput',
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Refeição cadastrada',
            },
            400: {
              description: 'Dados da refeição inválidos',
            },
            401: {
              description: 'Não autenticado',
            },
            404: {
              description: 'Alimento não encontrado',
            },
          },
        },
      },
      '/meals/daily-summary': {
        get: {
          tags: ['Refeições'],
          summary: 'Consultar resumo diário de calorias',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'date',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                format: 'date',
              },
            },
            {
              name: 'timezoneOffset',
              in: 'query',
              required: false,
              schema: {
                type: 'integer',
              },
            },
          ],
          responses: {
            200: {
              description: 'Resumo diário de calorias',
            },
            401: {
              description: 'Não autenticado',
            },
          },
        },
      },
      '/health-data': {
        get: {
          tags: ['Dados de saúde'],
          summary: 'Consultar dados de saúde',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Dados de saúde',
            },
            401: {
              description: 'Não autenticado',
            },
          },
        },
        post: {
          tags: ['Dados de saúde'],
          summary: 'Cadastrar dados de saúde',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthDataInput',
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Dados de saúde cadastrados',
            },
            400: {
              description: 'Dados inválidos',
            },
            401: {
              description: 'Não autenticado',
            },
          },
        },
        put: {
          tags: ['Dados de saúde'],
          summary: 'Atualizar dados de saúde',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthDataInput',
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Dados de saúde atualizados',
            },
            400: {
              description: 'Dados inválidos',
            },
            401: {
              description: 'Não autenticado',
            },
          },
        },
      },
      '/metrics': {
        get: {
          tags: ['Métricas'],
          summary: 'Consultar métricas do usuário',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Métricas calculadas',
            },
            401: {
              description: 'Não autenticado',
            },
          },
        },
      },
    },
  },
  apis: [],
});
