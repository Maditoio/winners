-- Check all transactions for the affected user
SELECT 
  t.id,
  t.type,
  t.amount,
  t.status,
  t.description,
  t."txHash",
  t."createdAt",
  t."updatedAt",
  w.balance as "currentWalletBalance"
FROM "Transaction" t
JOIN "Wallet" w ON w."userId" = t."userId"
WHERE t.amount = 10.93
ORDER BY t."createdAt" DESC;

-- Check wallet update history
SELECT 
  id,
  "userId",
  balance,
  "createdAt",
  "updatedAt"
FROM "Wallet"
WHERE id IN (
  SELECT "userId" FROM "Transaction" WHERE amount = 10.93 LIMIT 1
);
