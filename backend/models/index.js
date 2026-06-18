'use strict';

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const Op = {
  or: Symbol.for('sequelize.or'),
  in: Symbol.for('sequelize.in'),
  ne: Symbol.for('sequelize.ne'),
  between: Symbol.for('sequelize.between')
};

const modelNames = [
  'User',
  'College',
  'Senior',
  'Junior',
  'Elementary',
  'Teacher',
  'Instructor',
  'Attendancecollege',
  'Attendancesenior',
  'Attendancejunior',
  'Attendanceelementary',
  'Attendanceteacher',
  'Attendanceinstructor',
  'request_college',
  'request_senior',
  'request_junior',
  'request_elementary',
  'request_teacher',
  'request_instructor'
];

function delegateName(modelName) {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}

function normalizeId(value) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
}

function getOpKey(condition, op) {
  return Object.getOwnPropertySymbols(condition).find(symbol => symbol === op);
}

function convertWhere(where = {}) {
  const converted = {};

  for (const key of Object.keys(where)) {
    const value = where[key];

    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      const inKey = getOpKey(value, Op.in);
      const neKey = getOpKey(value, Op.ne);
      const betweenKey = getOpKey(value, Op.between);

      if (inKey) {
        converted[key] = { in: value[inKey] };
      } else if (neKey) {
        converted[key] = { not: value[neKey] };
      } else if (betweenKey) {
        const [gte, lte] = value[betweenKey];
        converted[key] = { gte, lte };
      } else {
        converted[key] = convertWhere(value);
      }
    } else {
      converted[key] = key === 'id' ? normalizeId(value) : value;
    }
  }

  const orKey = getOpKey(where, Op.or);
  if (orKey) {
    converted.OR = where[orKey].map(convertWhere);
  }

  return converted;
}

function convertOrder(order) {
  if (!Array.isArray(order)) return undefined;

  return order
    .filter(item => Array.isArray(item) && item.length >= 2)
    .map(([field, direction]) => ({
      [field]: String(direction).toLowerCase() === 'desc' ? 'desc' : 'asc'
    }));
}

function convertAttributes(attributes) {
  if (!attributes) return {};

  if (Array.isArray(attributes)) {
    return {
      select: Object.fromEntries(attributes.map(field => [field, true]))
    };
  }

  if (attributes.exclude) {
    return {
      omit: Object.fromEntries(attributes.exclude.map(field => [field, true]))
    };
  }

  return {};
}

function wrapRecord(model, data) {
  if (!data) return null;

  const target = {
    dataValues: { ...data },
    toJSON() {
      return { ...this.dataValues };
    },
    async save() {
      const { id, ...data } = this.dataValues;
      const updated = await model._delegate.update({
        where: { id: normalizeId(id) },
        data
      });
      this.dataValues = { ...updated };
      return this;
    }
  };

  return new Proxy(target, {
    get(obj, prop) {
      if (prop in obj) return obj[prop];
      return obj.dataValues[prop];
    },
    set(obj, prop, value) {
      obj.dataValues[prop] = value;
      return true;
    },
    has(obj, prop) {
      return prop in obj || prop in obj.dataValues;
    },
    ownKeys(obj) {
      return Reflect.ownKeys(obj.dataValues);
    },
    getOwnPropertyDescriptor(obj, prop) {
      if (prop in obj.dataValues) {
        return {
          enumerable: true,
          configurable: true,
          value: obj.dataValues[prop]
        };
      }
      return Object.getOwnPropertyDescriptor(obj, prop);
    }
  });
}

function createModel(modelName) {
  const delegate = prisma[delegateName(modelName)];

  const model = {
    name: modelName,
    _delegate: delegate,

    async findAll(options = {}) {
      const rows = await delegate.findMany({
        where: convertWhere(options.where),
        orderBy: convertOrder(options.order),
        take: options.limit ? Number(options.limit) : undefined,
        ...convertAttributes(options.attributes)
      });
      return rows.map(row => wrapRecord(model, row));
    },

    async findOne(options = {}) {
      const row = await delegate.findFirst({
        where: convertWhere(options.where),
        orderBy: convertOrder(options.order),
        ...convertAttributes(options.attributes)
      });
      return wrapRecord(model, row);
    },

    async findByPk(id) {
      const row = await delegate.findUnique({
        where: { id: normalizeId(id) }
      });
      return wrapRecord(model, row);
    },

    async create(data) {
      const row = await delegate.create({ data });
      return wrapRecord(model, row);
    },

    async bulkCreate(rows) {
      const result = await delegate.createMany({ data: rows });
      return result;
    },

    async update(data, options = {}) {
      const result = await delegate.updateMany({
        where: convertWhere(options.where),
        data
      });
      return [result.count];
    },

    async destroy(options = {}) {
      const result = await delegate.deleteMany({
        where: convertWhere(options.where)
      });
      return result.count;
    },

    async count(options = {}) {
      return delegate.count({
        where: convertWhere(options.where)
      });
    }
  };

  return model;
}

const db = Object.fromEntries(
  modelNames.map(modelName => [modelName, createModel(modelName)])
);

db.prisma = prisma;
db.Op = Op;

module.exports = db;
