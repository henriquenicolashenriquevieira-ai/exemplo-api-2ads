# Roteiro para o Codex — API REST "Armazém do Seu João"

Repositório: `exemplo-api-2ads`. Stack: **TypeScript + Node 20 + Express + SQLite (sqlite3) + Zod + tsx**, em camadas (Routes → Controller → Service → Repository → SQLite).

> **Leia antes de qualquer coisa:** `AGENTS.md` (regras fixas, incluindo **não fazer commits**).

## Como usar

O usuário vai pedir uma etapa por vez, por exemplo: *"Faça a etapa 03 do ETAPAS-CODEX.md"*.
Execute **somente** a etapa pedida, rode as verificações, e **pare**. Não faça commit, não crie branch, não avance para a próxima etapa.

Ao terminar cada etapa, responda neste formato:

1. Arquivos criados/alterados (lista).
2. Resultado de cada verificação (passou / falhou + saída relevante).
3. Qualquer divergência em relação ao roteiro (se houver).
4. "Pronto para commit": branch `feat-etapa-XX` e a mensagem de commit sugerida da etapa. **Quem commita é o usuário.**

## Índice

| Etapa | Passos | Descrição | Branch | Mensagem de commit sugerida |
|---|---|---|---|---|
| 01 | 1 a 7 | Setup inicial do projeto | `feat-etapa-01` | `feat: implementa etapa 01 - setup inicial do projeto` |
| 02 | 8 a 10 | Banco de dados (schema e conexão) | `feat-etapa-02` | `feat: etapa 02 - banco de dados (schema e conexão)` |
| 03 | 11 | Models (interfaces TypeScript) | `feat-etapa-03` | `feat: etapa 03 - models (interfaces TypeScript)` |
| 04 | 12 e 13 | Erros e validações | `feat-etapa-04` | `feat: etapa 04 - erros e validações com Zod` |
| 05 | 14 | Entidade Product (completa) | `feat-etapa-05` | `feat: etapa 05 - entidade Product completa` |
| 06 | 15 | Entidade Customer (completa) | `feat-etapa-06` | `feat: etapa 06 - entidade Customer completa` |
| 07 | 16 | Entidade Order (completa) | `feat-etapa-07` | `feat: etapa 07 - entidade Order completa` |
| 08 | 17 e 18 | Agregador de rotas e middleware de erros | `feat-etapa-08` | `feat: etapa 08 - agregador de rotas e middleware de erros` |
| 09 | 19 e 20 | App e server | `feat-etapa-09` | `feat: etapa 09 - app e server` |
| 10 | 21 e 22 | Seed e requests.http | `feat-etapa-10` | `feat: etapa 10 - seed de dados e requests.http` |

---

## Regras de negócio (usadas nos Services)

- **RN01** e-mail de cliente é único (409).
- **RN05** `unit_price` do item de pedido = preço do produto no momento da venda.
- **RN06** não remover cliente que tem pedidos (409).
- **RN07** não remover produto que está em algum pedido (409).

Status HTTP: 200 sucesso · 201 criado · 204 removido · 400 dados inválidos (Zod) · 404 não encontrado · 409 conflito · 500 erro inesperado.

---

## Etapa 01 — Setup inicial do projeto

- **Passos do README:** 1 a 7
- **Branch (o usuário cria):** `feat-etapa-01`
- **Pré-requisito:** Repositório `exemplo-api-2ads` já clonado, vazio (ou só com README/.gitignore criados pelo GitHub). Node 20+.

**Objetivo:** Inicializar o projeto Node + TypeScript, instalar dependências, configurar TypeScript, scripts, .gitignore e a estrutura de pastas.

### Tarefas

1. `npm init -y`
2. `npm install express sqlite3 zod`
3. `npm install -D typescript tsx @types/node @types/express`
4. Criar `tsconfig.json` na raiz com **exatamente**:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
```

5. No `package.json`, **substituir** o campo `"scripts"` por:

```json
"scripts": {
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "db:init": "tsx src/database/init.ts",
  "db:seed": "tsx src/database/seed.ts"
}
```

6. Criar `.gitignore` na raiz (se já existir, garantir que contém estas linhas, sem remover as que já estiverem lá):

```
node_modules/
dist/
*.db
.env
```

7. Criar as pastas abaixo (use o comando adequado ao shell; no PowerShell, `New-Item -ItemType Directory`), cada uma com um arquivo vazio `.gitkeep`:
   `src/config`, `src/models`, `src/repositories`, `src/services`, `src/controllers`, `src/routes`, `src/middlewares`, `src/schemas`, `src/errors`, `src/database`.
   Quando uma etapa posterior criar o primeiro arquivo real numa dessas pastas, **apague o `.gitkeep` dela**.

### Verificação

- `node --version` ≥ 20 e `npx tsc --version` funcionando.
- `package.json` tem as 3 dependências de produção, as 4 de desenvolvimento e os 5 scripts.
- **Não** rode `tsc` ainda (ainda não há arquivos em `src/`, o que gera erro TS18003).
- `git status` não deve listar `node_modules/`.

### Ao terminar

Pare e reporte no formato do topo deste arquivo. Mensagem de commit sugerida (**o usuário commita**): `feat: implementa etapa 01 - setup inicial do projeto`

---

## Etapa 02 — Banco de dados (schema e conexão)

- **Passos do README:** 8 a 10
- **Branch (o usuário cria):** `feat-etapa-02`
- **Pré-requisito:** Etapa 01 concluída.

**Objetivo:** Criar o schema SQL, o script de inicialização do banco e a conexão centralizada com o SQLite.

### Criar os arquivos (copiar exatamente)

**`src/database/schema.sql`**

```sql
CREATE TABLE IF NOT EXISTS customers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  phone      TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  description TEXT,
  price       REAL NOT NULL CHECK (price > 0),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  total       REAL NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  unit_price REAL    NOT NULL CHECK (unit_price > 0),
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

**`src/database/init.ts`**

```ts
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../database.db');
const schemaPath = path.resolve(__dirname, 'schema.sql');

const schema = fs.readFileSync(schemaPath, 'utf-8');
const db = new sqlite3.Database(dbPath);

db.exec(schema, (err) => {
  if (err) {
    console.error('Erro ao criar o schema:', err);
    process.exit(1);
  }
  console.log('Banco inicializado com sucesso em', dbPath);
  db.close();
});
```

**`src/config/database.ts`**

```ts
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../database.db');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco:', err);
    process.exit(1);
  }
});

db.run('PRAGMA foreign_keys = ON;');
```

### Verificação

- `npm run db:init` deve imprimir "Banco inicializado com sucesso em ..." e criar `database.db` na raiz (esse arquivo é ignorado pelo Git).
- `npx tsc --noEmit` sem erros.

### Ao terminar

Pare e reporte no formato do topo deste arquivo. Mensagem de commit sugerida (**o usuário commita**): `feat: etapa 02 - banco de dados (schema e conexão)`

---

## Etapa 03 — Models (interfaces TypeScript)

- **Passos do README:** 11
- **Branch (o usuário cria):** `feat-etapa-03`
- **Pré-requisito:** Etapa 02 concluída.

**Objetivo:** Criar as interfaces e tipos das entidades Product, Customer e Order.

### Criar os arquivos (copiar exatamente)

**`src/models/product.model.ts`**

```ts
export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  created_at: string;
}

export type CreateProductInput = Omit<Product, 'id' | 'created_at'>;
export type UpdateProductInput = Partial<CreateProductInput>;
```

**`src/models/customer.model.ts`**

```ts
export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

export type CreateCustomerInput = Omit<Customer, 'id' | 'created_at'>;
export type UpdateCustomerInput = Partial<CreateCustomerInput>;
```

**`src/models/order.model.ts`**

```ts
export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: number;
  customer_id: number;
  total: number;
  created_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface CreateOrderInput {
  customer_id: number;
  items: Array<{ product_id: number; quantity: number }>;
}
```

### Verificação

- `npx tsc --noEmit` sem erros.

### Ao terminar

Pare e reporte no formato do topo deste arquivo. Mensagem de commit sugerida (**o usuário commita**): `feat: etapa 03 - models (interfaces TypeScript)`

---

## Etapa 04 — Erros e validações

- **Passos do README:** 12 e 13
- **Branch (o usuário cria):** `feat-etapa-04`
- **Pré-requisito:** Etapa 03 concluída.

**Objetivo:** Criar a classe de erro customizada e os schemas de validação Zod.

### Criar os arquivos (copiar exatamente)

**`src/errors/app-error.ts`**

```ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode = 400,
  ) {
    super(message);
  }
}
```

**`src/schemas/product.schema.ts`**

```ts
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
});

export const updateProductSchema = createProductSchema.partial();
```

**`src/schemas/customer.schema.ts`**

```ts
import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();
```

**`src/schemas/order.schema.ts`**

```ts
import { z } from 'zod';

export const createOrderSchema = z.object({
  customer_id: z.number().int().positive(),
  items: z
    .array(
      z.object({
        product_id: z.number().int().positive(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});
```

### Verificação

- `npx tsc --noEmit` sem erros.

### Ao terminar

Pare e reporte no formato do topo deste arquivo. Mensagem de commit sugerida (**o usuário commita**): `feat: etapa 04 - erros e validações com Zod`

---

## Etapa 05 — Entidade Product (completa)

- **Passos do README:** 14
- **Branch (o usuário cria):** `feat-etapa-05`
- **Pré-requisito:** Etapa 04 concluída.

**Objetivo:** Implementar Product de ponta a ponta, na ordem Repository → Service → Controller → Routes. O router ainda NÃO é ligado ao app (isso é a etapa 08).

### Notas

- **Atenção (incompatibilidade Zod × model):** no schema, `description` é `string | undefined`; no model é `string | null`. O controller de criação converte com `description ?? null` antes de chamar o service (já está no código abaixo). Não "corrija" mudando o schema ou o model.
- RN07: produto que já está em pedido não pode ser removido (409).

### Criar os arquivos (copiar exatamente)

**`src/repositories/product.repository.ts`**

```ts
import { db } from '../config/database';
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from '../models/product.model';

export const productRepository = {
  findAll(): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM products ORDER BY id', (err, rows: Product[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  findById(id: number): Promise<Product | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM products WHERE id = ?',
        [id],
        (err, row: Product | undefined) => {
          if (err) reject(err);
          else resolve(row ?? null);
        },
      );
    });
  },

  create(input: CreateProductInput): Promise<Product> {
    return new Promise((resolve, reject) => {
      const { name, description, price } = input;
      db.run(
        'INSERT INTO products (name, description, price) VALUES (?, ?, ?)',
        [name, description ?? null, price],
        function (err) {
          if (err) return reject(err);
          productRepository
            .findById(this.lastID)
            .then((p) => resolve(p!))
            .catch(reject);
        },
      );
    });
  },

  update(id: number, input: UpdateProductInput): Promise<Product | null> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: unknown[] = [];
      if (input.name !== undefined) {
        fields.push('name = ?');
        values.push(input.name);
      }
      if (input.description !== undefined) {
        fields.push('description = ?');
        values.push(input.description);
      }
      if (input.price !== undefined) {
        fields.push('price = ?');
        values.push(input.price);
      }
      if (fields.length === 0)
        return productRepository.findById(id).then(resolve).catch(reject);

      values.push(id);
      db.run(
        `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
        values,
        (err) => {
          if (err) return reject(err);
          productRepository.findById(id).then(resolve).catch(reject);
        },
      );
    });
  },

  delete(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  },

  existsInOrder(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT 1 FROM order_items WHERE product_id = ? LIMIT 1',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        },
      );
    });
  },
};
```

**`src/services/product.service.ts`**

```ts
import { productRepository } from '../repositories/product.repository';
import {
  CreateProductInput,
  UpdateProductInput,
} from '../models/product.model';
import { AppError } from '../errors/app-error';

export const productService = {
  list() {
    return productRepository.findAll();
  },

  async getById(id: number) {
    const product = await productRepository.findById(id);
    if (!product) throw new AppError('Produto não encontrado', 404);
    return product;
  },

  create(input: CreateProductInput) {
    return productRepository.create(input);
  },

  async update(id: number, input: UpdateProductInput) {
    await this.getById(id); // garante que existe (ou lança 404)
    return productRepository.update(id, input);
  },

  async remove(id: number) {
    await this.getById(id);
    // RN07: não pode remover produto que já está em pedido
    if (await productRepository.existsInOrder(id)) {
      throw new AppError(
        'Produto não pode ser removido: há pedidos associados',
        409,
      );
    }
    await productRepository.delete(id);
  },
};
```

**`src/controllers/product.controller.ts`**

```ts
import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';
import {
  createProductSchema,
  updateProductSchema,
} from '../schemas/product.schema';

export const productController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await productService.list());
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await productService.getById(Number(req.params.id)));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createProductSchema.parse(req.body);
      // Schema usa string | undefined; o model usa string | null.
      const data = { ...parsed, description: parsed.description ?? null };
      res.status(201).json(await productService.create(data));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateProductSchema.parse(req.body);
      res.json(await productService.update(Number(req.params.id), data));
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await productService.remove(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
```

**`src/routes/product.routes.ts`**

```ts
import { Router } from 'express';
import { productController } from '../controllers/product.controller';

const router = Router();

router.get('/', productController.list);
router.get('/:id', productController.getById);
router.post('/', productController.create);
router.put('/:id', productController.update);
router.delete('/:id', productController.remove);

export default router;
```

### Verificação

- `npx tsc --noEmit` sem erros.

### Ao terminar

Pare e reporte no formato do topo deste arquivo. Mensagem de commit sugerida (**o usuário commita**): `feat: etapa 05 - entidade Product completa`

---

## Etapa 06 — Entidade Customer (completa)

- **Passos do README:** 15
- **Branch (o usuário cria):** `feat-etapa-06`
- **Pré-requisito:** Etapa 05 concluída.

**Objetivo:** Implementar Customer seguindo o mesmo padrão de Product.

### Notas

- RN01: e-mail único (409 "E-mail já cadastrado"), tanto na criação quanto na atualização (ignorando o próprio id).
- RN06: cliente com pedidos não pode ser removido (409).
- A rota `GET /customers/:id/orders` NÃO existe ainda: ela depende do `orderService` e será adicionada na etapa 07. O código abaixo já está sem ela.

### Criar os arquivos (copiar exatamente)

**`src/repositories/customer.repository.ts`**

```ts
import { db } from '../config/database';
import {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '../models/customer.model';

export const customerRepository = {
  findAll(): Promise<Customer[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM customers ORDER BY id', (err, rows: Customer[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  findById(id: number): Promise<Customer | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM customers WHERE id = ?',
        [id],
        (err, row: Customer | undefined) => {
          if (err) reject(err);
          else resolve(row ?? null);
        },
      );
    });
  },

  findByEmail(email: string): Promise<Customer | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM customers WHERE email = ?',
        [email],
        (err, row: Customer | undefined) => {
          if (err) reject(err);
          else resolve(row ?? null);
        },
      );
    });
  },

  create(input: CreateCustomerInput): Promise<Customer> {
    return new Promise((resolve, reject) => {
      const { name, email, phone } = input;
      db.run(
        'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
        [name, email, phone ?? null],
        function (err) {
          if (err) return reject(err);
          customerRepository
            .findById(this.lastID)
            .then((c) => resolve(c!))
            .catch(reject);
        },
      );
    });
  },

  update(id: number, input: UpdateCustomerInput): Promise<Customer | null> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: unknown[] = [];
      if (input.name !== undefined) {
        fields.push('name = ?');
        values.push(input.name);
      }
      if (input.email !== undefined) {
        fields.push('email = ?');
        values.push(input.email);
      }
      if (input.phone !== undefined) {
        fields.push('phone = ?');
        values.push(input.phone);
      }
      if (fields.length === 0)
        return customerRepository.findById(id).then(resolve).catch(reject);

      values.push(id);
      db.run(
        `UPDATE customers SET ${fields.join(', ')} WHERE id = ?`,
        values,
        (err) => {
          if (err) return reject(err);
          customerRepository.findById(id).then(resolve).catch(reject);
        },
      );
    });
  },

  delete(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM customers WHERE id = ?', [id], function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  },

  existsInOrder(customerId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT 1 FROM orders WHERE customer_id = ? LIMIT 1',
        [customerId],
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        },
      );
    });
  },
};
```

**`src/services/customer.service.ts`**

```ts
import { customerRepository } from '../repositories/customer.repository';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
} from '../models/customer.model';
import { AppError } from '../errors/app-error';

export const customerService = {
  list() {
    return customerRepository.findAll();
  },

  async getById(id: number) {
    const customer = await customerRepository.findById(id);
    if (!customer) throw new AppError('Cliente não encontrado', 404);
    return customer;
  },

  async create(input: CreateCustomerInput) {
    // RN01: e-mail único
    if (await customerRepository.findByEmail(input.email)) {
      throw new AppError('E-mail já cadastrado', 409);
    }
    return customerRepository.create(input);
  },

  async update(id: number, input: UpdateCustomerInput) {
    await this.getById(id);
    if (input.email !== undefined) {
      const other = await customerRepository.findByEmail(input.email);
      if (other && other.id !== id) {
        throw new AppError('E-mail já cadastrado', 409);
      }
    }
    return customerRepository.update(id, input);
  },

  async remove(id: number) {
    await this.getById(id);
    // RN06: não remover cliente com pedidos
    if (await customerRepository.existsInOrder(id)) {
      throw new AppError(
        'Cliente não pode ser removido: há pedidos associados',
        409,
      );
    }
    await customerRepository.delete(id);
  },
};
```

**`src/controllers/customer.controller.ts`**

```ts
import { Request, Response, NextFunction } from 'express';
import { customerService } from '../services/customer.service';
import {
  createCustomerSchema,
  updateCustomerSchema,
} from '../schemas/customer.schema';

export const customerController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await customerService.list());
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await customerService.getById(Number(req.params.id)));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createCustomerSchema.parse(req.body);
      const data = { ...parsed, phone: parsed.phone ?? null };
      res.status(201).json(await customerService.create(data));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateCustomerSchema.parse(req.body);
      res.json(await customerService.update(Number(req.params.id), data));
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await customerService.remove(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

};
```

**`src/routes/customer.routes.ts`**

```ts
import { Router } from 'express';
import { customerController } from '../controllers/customer.controller';

const router = Router();

router.get('/', customerController.list);
router.get('/:id', customerController.getById);
router.post('/', customerController.create);
router.put('/:id', customerController.update);
router.delete('/:id', customerController.remove);

export default router;
```

### Verificação

- `npx tsc --noEmit` sem erros.

### Ao terminar

Pare e reporte no formato do topo deste arquivo. Mensagem de commit sugerida (**o usuário commita**): `feat: etapa 06 - entidade Customer completa`

---

## Etapa 07 — Entidade Order (completa)

- **Passos do README:** 16
- **Branch (o usuário cria):** `feat-etapa-07`
- **Pré-requisito:** Etapa 06 concluída.

**Objetivo:** Implementar Order (a mais complexa) e adicionar a rota `GET /customers/:id/orders` ao Customer.

### Notas

- RN05: o `unit_price` do item é uma "fotografia" do preço do produto no momento da venda.
- A criação do pedido NÃO usa transação de propósito (é um desafio proposto no README). Mantenha o comentário `TODO (desafio 1)` no service.
- Os 2 arquivos de customer abaixo (seção "Substituir") substituem os da etapa 06 por completo.

### Criar os arquivos (copiar exatamente)

**`src/repositories/order.repository.ts`**

```ts
import { db } from '../config/database';
import { Order, OrderItem, OrderWithItems } from '../models/order.model';

export const orderRepository = {
  createOrder(customerId: number, total: number): Promise<number> {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO orders (customer_id, total) VALUES (?, ?)',
        [customerId, total],
        function (err) {
          err ? reject(err) : resolve(this.lastID);
        },
      );
    });
  },

  addItem(
    orderId: number,
    productId: number,
    quantity: number,
    unitPrice: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, productId, quantity, unitPrice],
        (err) => (err ? reject(err) : resolve()),
      );
    });
  },

  findById(id: number): Promise<OrderWithItems | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM orders WHERE id = ?',
        [id],
        (err, order: Order | undefined) => {
          if (err) return reject(err);
          if (!order) return resolve(null);
          db.all(
            'SELECT * FROM order_items WHERE order_id = ?',
            [id],
            (err2, items: OrderItem[]) => {
              if (err2) reject(err2);
              else resolve({ ...order, items });
            },
          );
        },
      );
    });
  },

  findAll(): Promise<Order[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM orders ORDER BY id DESC', (err, rows: Order[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  findByCustomerId(customerId: number): Promise<Order[]> {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM orders WHERE customer_id = ? ORDER BY id DESC',
        [customerId],
        (err, rows: Order[]) => {
          if (err) reject(err);
          else resolve(rows);
        },
      );
    });
  },
};
```

**`src/services/order.service.ts`**

```ts
import { orderRepository } from '../repositories/order.repository';
import { productRepository } from '../repositories/product.repository';
import { customerRepository } from '../repositories/customer.repository';
import { CreateOrderInput } from '../models/order.model';
import { AppError } from '../errors/app-error';

export const orderService = {
  async create(input: CreateOrderInput) {
    const customer = await customerRepository.findById(input.customer_id);
    if (!customer) throw new AppError('Cliente não encontrado', 404);

    const prepared: Array<{
      product_id: number;
      quantity: number;
      unit_price: number;
    }> = [];
    let total = 0;

    for (const item of input.items) {
      const product = await productRepository.findById(item.product_id);
      if (!product)
        throw new AppError(`Produto ${item.product_id} não encontrado`, 404);

      prepared.push({
        product_id: product.id,
        quantity: item.quantity,
        unit_price: product.price, // RN05: fotografia do preço no momento da venda
      });
      total += product.price * item.quantity;
    }

    // TODO (desafio 1): envolver as inserções abaixo em uma transação.
    const orderId = await orderRepository.createOrder(
      input.customer_id,
      Math.round(total * 100) / 100,
    );
    for (const it of prepared) {
      await orderRepository.addItem(
        orderId,
        it.product_id,
        it.quantity,
        it.unit_price,
      );
    }
    return orderRepository.findById(orderId);
  },

  async getById(id: number) {
    const order = await orderRepository.findById(id);
    if (!order) throw new AppError('Pedido não encontrado', 404);
    return order;
  },

  list() {
    return orderRepository.findAll();
  },

  async listByCustomer(customerId: number) {
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new AppError('Cliente não encontrado', 404);
    return orderRepository.findByCustomerId(customerId);
  },
};
```

**`src/controllers/order.controller.ts`**

```ts
import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/order.service';
import { createOrderSchema } from '../schemas/order.schema';

export const orderController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await orderService.list());
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await orderService.getById(Number(req.params.id)));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createOrderSchema.parse(req.body);
      res.status(201).json(await orderService.create(data));
    } catch (err) {
      next(err);
    }
  },
};
```

**`src/routes/order.routes.ts`**

```ts
import { Router } from 'express';
import { orderController } from '../controllers/order.controller';

const router = Router();

router.get('/', orderController.list);
router.get('/:id', orderController.getById);
router.post('/', orderController.create);

export default router;
```

### Substituir (arquivos da etapa 06, conteúdo final completo)

**`src/controllers/customer.controller.ts`**

```ts
import { Request, Response, NextFunction } from 'express';
import { customerService } from '../services/customer.service';
import { orderService } from '../services/order.service';
import {
  createCustomerSchema,
  updateCustomerSchema,
} from '../schemas/customer.schema';

export const customerController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await customerService.list());
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await customerService.getById(Number(req.params.id)));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createCustomerSchema.parse(req.body);
      const data = { ...parsed, phone: parsed.phone ?? null };
      res.status(201).json(await customerService.create(data));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateCustomerSchema.parse(req.body);
      res.json(await customerService.update(Number(req.params.id), data));
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await customerService.remove(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async listOrders(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await orderService.listByCustomer(Number(req.params.id)));
    } catch (err) {
      next(err);
    }
  },
};
```

**`src/routes/customer.routes.ts`**

```ts
import { Router } from 'express';
import { customerController } from '../controllers/customer.controller';

const router = Router();

router.get('/', customerController.list);
router.get('/:id', customerController.getById);
router.get('/:id/orders', customerController.listOrders);
router.post('/', customerController.create);
router.put('/:id', customerController.update);
router.delete('/:id', customerController.remove);

export default router;
```

### Verificação

- `npx tsc --noEmit` sem erros.

### Ao terminar

Pare e reporte no formato do topo deste arquivo. Mensagem de commit sugerida (**o usuário commita**): `feat: etapa 07 - entidade Order completa`

---

## Etapa 08 — Agregador de rotas e middleware de erros

- **Passos do README:** 17 e 18
- **Branch (o usuário cria):** `feat-etapa-08`
- **Pré-requisito:** Etapa 07 concluída.

**Objetivo:** Agregar as rotas e criar o middleware central de tratamento de erros.

### Notas

- O middleware de erro precisa ter exatamente 4 parâmetros (é assim que o Express o reconhece).

### Criar os arquivos (copiar exatamente)

**`src/routes/index.ts`**

```ts
import { Router } from 'express';
import productRoutes from './product.routes';
import customerRoutes from './customer.routes';
import orderRoutes from './order.routes';

const router = Router();

router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/orders', orderRoutes);

export default router;
```

**`src/middlewares/error-handler.ts`**

```ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res
      .status(400)
      .json({ error: 'Dados inválidos', details: err.issues });
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Erro interno no servidor' });
}
```

### Verificação

- `npx tsc --noEmit` sem erros.

### Ao terminar

Pare e reporte no formato do topo deste arquivo. Mensagem de commit sugerida (**o usuário commita**): `feat: etapa 08 - agregador de rotas e middleware de erros`

---

## Etapa 09 — App e server

- **Passos do README:** 19 e 20
- **Branch (o usuário cria):** `feat-etapa-09`
- **Pré-requisito:** Etapa 08 concluída.

**Objetivo:** Configurar o Express e subir o servidor.

### Notas

- `errorHandler` deve ser o último `app.use`.

### Criar os arquivos (copiar exatamente)

**`src/app.ts`**

```ts
import express from 'express';
import routes from './routes';
import { errorHandler } from './middlewares/error-handler';

export const app = express();

app.use(express.json());
app.use(routes);
app.use(errorHandler); // sempre por último
```

**`src/server.ts`**

```ts
import { app } from './app';

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
```

### Verificação

- `npx tsc --noEmit` sem erros.
- Rodar `npm run db:init`, subir o servidor em segundo plano (`npm run dev` ou `npx tsx src/server.ts`), conferir `curl http://localhost:3000/products` → `[]` e **encerrar o processo do servidor** ao final.

### Ao terminar

Pare e reporte no formato do topo deste arquivo. Mensagem de commit sugerida (**o usuário commita**): `feat: etapa 09 - app e server`

---

## Etapa 10 — Seed e requests.http

- **Passos do README:** 21 e 22
- **Branch (o usuário cria):** `feat-etapa-10`
- **Pré-requisito:** Etapa 09 concluída.

**Objetivo:** Criar o seed de dados de exemplo e o arquivo de requisições para o REST Client.

### Criar os arquivos (copiar exatamente)

**`src/database/seed.ts`**

```ts
import { db } from '../config/database';

db.serialize(() => {
  db.run('DELETE FROM order_items');
  db.run('DELETE FROM orders');
  db.run('DELETE FROM products');
  db.run('DELETE FROM customers');

  db.run('INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)', [
    'Maria Silva',
    'maria@email.com',
    '11999990001',
  ]);
  db.run('INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)', [
    'João Pereira',
    'joao@email.com',
    '11999990002',
  ]);

  db.run('INSERT INTO products (name, description, price) VALUES (?, ?, ?)', [
    'Arroz 5kg',
    'Arroz branco tipo 1',
    28.9,
  ]);
  db.run('INSERT INTO products (name, description, price) VALUES (?, ?, ?)', [
    'Feijão 1kg',
    'Feijão carioca',
    9.5,
  ]);
  db.run('INSERT INTO products (name, description, price) VALUES (?, ?, ?)', [
    'Óleo de Soja 900ml',
    null,
    7.2,
  ]);

  console.log('Seed executado com sucesso.');
});
```

**`requests.http`**

```http
@baseUrl = http://localhost:3000

### ===== PRODUTOS =====

### Listar todos os produtos
GET {{baseUrl}}/products

### Buscar um produto
GET {{baseUrl}}/products/1

### Criar um produto
POST {{baseUrl}}/products
Content-Type: application/json

{
  "name": "Açúcar Refinado 1kg",
  "description": "Açúcar cristal refinado",
  "price": 5.90
}

### Atualizar um produto
PUT {{baseUrl}}/products/1
Content-Type: application/json

{
  "price": 29.90
}

### Remover um produto
DELETE {{baseUrl}}/products/3

### ===== CLIENTES =====

### Listar clientes
GET {{baseUrl}}/customers

### Buscar um cliente
GET {{baseUrl}}/customers/1

### Criar um cliente
POST {{baseUrl}}/customers
Content-Type: application/json

{
  "name": "Ana Souza",
  "email": "ana@email.com",
  "phone": "11988887777"
}

### Atualizar um cliente
PUT {{baseUrl}}/customers/1
Content-Type: application/json

{
  "phone": "11977776666"
}

### Listar pedidos de um cliente
GET {{baseUrl}}/customers/1/orders

### Remover um cliente
DELETE {{baseUrl}}/customers/2

### ===== PEDIDOS =====

### Criar um pedido
POST {{baseUrl}}/orders
Content-Type: application/json

{
  "customer_id": 1,
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 2, "quantity": 3 }
  ]
}

### Listar pedidos
GET {{baseUrl}}/orders

### Ver um pedido específico (com os itens)
GET {{baseUrl}}/orders/1

### ===== ERROS DE PROPÓSITO =====

### Produto sem nome (400)
POST {{baseUrl}}/products
Content-Type: application/json

{ "price": 10 }

### Preço negativo (400)
POST {{baseUrl}}/products
Content-Type: application/json

{ "name": "Teste", "price": -5 }

### Pedido com cliente inexistente (404)
POST {{baseUrl}}/orders
Content-Type: application/json

{ "customer_id": 999, "items": [{ "product_id": 1, "quantity": 1 }] }
```

### Verificação

- `npx tsc --noEmit` sem erros.
- `npm run db:init && npm run db:seed` imprime "Seed executado com sucesso."
- Subir o servidor, conferir `GET /products` (3 produtos), criar um pedido com `POST /orders` (cliente 1; produtos 1 e 2) e conferir `GET /orders/1`. Depois **encerrar o servidor**.

### Ao terminar

Pare e reporte no formato do topo deste arquivo. Mensagem de commit sugerida (**o usuário commita**): `feat: etapa 10 - seed de dados e requests.http`

---
