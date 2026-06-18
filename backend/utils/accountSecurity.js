const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12;

const SYSTEM_ACCOUNT_TYPES = [
  { role: "admin", prefix: "AD", pad: 4, username: "admin", password: "admin123" },
  { role: "librarian", prefix: "LB", pad: 5, username: "librarian", password: "librarian123" }
];

const PERSON_ACCOUNT_TYPES = [
  { modelName: "College", passwordField: "password" },
  { modelName: "Senior", passwordField: "password" },
  { modelName: "Junior", passwordField: "password" },
  { modelName: "Elementary", passwordField: "password" },
  { modelName: "Teacher", passwordField: "password" },
  { modelName: "Instructor", passwordField: "password" }
];

function isBcryptHash(value) {
  return typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);
}

async function hashPassword(password) {
  if (!password) return null;
  if (isBcryptHash(password)) return password;
  return bcrypt.hash(String(password), SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
  if (!password || !hash || !isBcryptHash(hash)) return false;
  return bcrypt.compare(String(password), hash);
}

function formatId(prefix, number, pad) {
  return `${prefix}-${String(number).padStart(pad, "0")}`;
}

async function getNextSystemId(User, prefix, pad) {
  const users = await User.findAll();
  const max = users
    .map(user => user.user_id)
    .filter(id => typeof id === "string" && id.startsWith(`${prefix}-`))
    .map(id => Number(id.slice(prefix.length + 1)))
    .filter(Number.isFinite)
    .reduce((highest, current) => Math.max(highest, current), 0);

  return formatId(prefix, max + 1, pad);
}

async function ensureDefaultAccounts(db) {
  const { User } = db;

  for (const account of SYSTEM_ACCOUNT_TYPES) {
    const existing =
      (await User.findOne({ where: { user_name: account.username } })) ||
      (await User.findOne({ where: { user_id: formatId(account.prefix, 1, account.pad) } }));

    // Store password as plain text (not hashed)
    const passwordPlain = account.password;

    if (existing) {
      const updates = {};
      if (!existing.user_id || !String(existing.user_id).startsWith(`${account.prefix}-`)) {
        updates.user_id = formatId(account.prefix, 1, account.pad);
      }
      if (!existing.user_name) updates.user_name = account.username;
      if (existing.role !== account.role) updates.role = account.role;
      // Store plain text password
      if (existing.pass !== passwordPlain) updates.pass = passwordPlain;

      if (Object.keys(updates).length > 0) {
        await User.update(updates, { where: { id: existing.id } });
      }
    } else {
      await User.create({
        user_id: formatId(account.prefix, 1, account.pad),
        user_name: account.username,
        pass: passwordPlain,
        role: account.role
      });
    }
  }
}

async function hashExistingPasswords(db) {
  const { User } = db;
  const systemUsers = await User.findAll();

  for (const user of systemUsers) {
    if (user.pass && !isBcryptHash(user.pass)) {
      await User.update({ pass: await hashPassword(user.pass) }, { where: { id: user.id } });
    }
  }

  for (const accountType of PERSON_ACCOUNT_TYPES) {
    const model = db[accountType.modelName];
    if (!model) continue;

    const users = await model.findAll();
    for (const user of users) {
      const password = user[accountType.passwordField];
      if (password && !isBcryptHash(password)) {
        await model.update(
          { [accountType.passwordField]: await hashPassword(password) },
          { where: { id: user.id } }
        );
      }
    }
  }
}

async function ensureSystemAccounts(db) {
  await ensureDefaultAccounts(db);
  // Disabled: Keep passwords as plain text for display purposes
  // await hashExistingPasswords(db);
}

module.exports = {
  hashPassword,
  verifyPassword,
  isBcryptHash,
  getNextSystemId,
  ensureSystemAccounts
};
