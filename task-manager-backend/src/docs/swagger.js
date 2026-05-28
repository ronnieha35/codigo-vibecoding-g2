const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Task Manager API',
    version: '1.0.0',
    description: 'REST API para gestión de tareas con almacenamiento en memoria.',
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Servidor local' },
  ],
  paths: {
    '/api/tasks': {
      get: {
        summary: 'Listar todas las tareas',
        tags: ['Tasks'],
        responses: {
          200: {
            description: 'Lista de tareas',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Task' } },
              },
            },
          },
        },
      },
      post: {
        summary: 'Crear una tarea',
        tags: ['Tasks'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Tarea creada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Task' },
              },
            },
          },
        },
      },
    },
    '/api/users/register': {
      post: {
        summary: 'Registrar un nuevo usuario',
        tags: ['Users'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserRegisterInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Usuario creado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          400: {
            description: 'Campos requeridos faltantes',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          409: {
            description: 'El email ya está en uso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/users/login': {
      post: {
        summary: 'Iniciar sesión',
        tags: ['Users'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserLoginInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Login exitoso, retorna token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-...' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Campos requeridos faltantes',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          401: {
            description: 'Credenciales inválidas',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/tasks/{id}': {
      get: {
        summary: 'Obtener una tarea por ID',
        tags: ['Tasks'],
        parameters: [{ $ref: '#/components/parameters/TaskId' }],
        responses: {
          200: {
            description: 'Tarea encontrada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Task' },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        summary: 'Actualizar una tarea',
        tags: ['Tasks'],
        parameters: [{ $ref: '#/components/parameters/TaskId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskUpdate' },
            },
          },
        },
        responses: {
          200: {
            description: 'Tarea actualizada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Task' },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        summary: 'Eliminar una tarea',
        tags: ['Tasks'],
        parameters: [{ $ref: '#/components/parameters/TaskId' }],
        responses: {
          200: {
            description: 'Tarea eliminada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Task' },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id:         { type: 'string', format: 'uuid', example: 'a1b2c3d4-...' },
          name:       { type: 'string', example: 'Ana' },
          lastname:   { type: 'string', example: 'Lopez' },
          email:      { type: 'string', format: 'email', example: 'ana@example.com' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      UserRegisterInput: {
        type: 'object',
        required: ['name', 'lastname', 'email', 'password'],
        properties: {
          name:     { type: 'string', example: 'Ana' },
          lastname: { type: 'string', example: 'Lopez' },
          email:    { type: 'string', format: 'email', example: 'ana@example.com' },
          password: { type: 'string', example: 'secret123' },
        },
      },
      UserLoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email:    { type: 'string', format: 'email', example: 'ana@example.com' },
          password: { type: 'string', example: 'secret123' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Email already in use' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id:          { type: 'string', format: 'uuid', example: 'a1b2c3d4-...' },
          title:       { type: 'string', example: 'Comprar leche' },
          description: { type: 'string', example: 'Leche entera 1L' },
          status: {
            type: 'string',
            enum: ['pending', 'in-progress', 'completed'],
            example: 'pending',
          },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      TaskInput: {
        type: 'object',
        required: ['title'],
        properties: {
          title:       { type: 'string', example: 'Comprar leche' },
          description: { type: 'string', example: 'Leche entera 1L' },
        },
      },
      TaskUpdate: {
        type: 'object',
        properties: {
          title:       { type: 'string', example: 'Comprar leche descremada' },
          description: { type: 'string', example: 'Leche descremada 1L' },
          status: {
            type: 'string',
            enum: ['pending', 'in-progress', 'completed'],
            example: 'completed',
          },
        },
      },
    },
    parameters: {
      TaskId: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'ID único de la tarea',
      },
    },
    responses: {
      NotFound: {
        description: 'Tarea no encontrada',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { error: { type: 'string', example: 'Task not found' } },
            },
          },
        },
      },
    },
  },
};

export default swaggerSpec;
