import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixWalletBalance() {
  try {
    console.log('Finding transaction with amount 10.93...')
    
    // Find the transaction with 10.93 USDT
    const transaction = await prisma.transaction.findFirst({
      where: {
        amount: 10.93,
        type: 'DEPOSIT',
        status: 'COMPLETED'
      },
      include: {
        user: {
          include: {
            wallet: true
          }
        }
      }
    })

    if (!transaction) {
      console.log('No transaction found with amount 10.93')
      return
    }

    console.log('Transaction found:', {
      id: transaction.id,
      userId: transaction.userId,
      amount: transaction.amount.toString(),
      status: transaction.status,
      txHash: transaction.txHash
    })

    const currentBalance = Number(transaction.user.wallet?.balance || 0)
    const transactionAmount = Number(transaction.amount)
    const expectedBalance = transactionAmount // Assuming this was first deposit
    const difference = transactionAmount - currentBalance

    console.log('Balance check:', {
      currentBalance,
      transactionAmount,
      difference
    })

    if (Math.abs(difference - 10) < 0.01) {
      // The difference is approximately 10 USDT (the missing amount)
      console.log(`Found discrepancy: wallet has ${currentBalance} but should have ${transactionAmount}`)
      console.log(`Crediting missing ${difference} USDT...`)

      await prisma.wallet.update({
        where: { userId: transaction.userId },
        data: {
          balance: {
            increment: difference
          }
        }
      })

      const updatedWallet = await prisma.wallet.findUnique({
        where: { userId: transaction.userId }
      })

      console.log('✅ Wallet balance fixed!')
      console.log('New balance:', updatedWallet?.balance.toString())
    } else {
      console.log('Balance looks correct or difference is unexpected:', difference)
    }
  } catch (error) {
    console.error('Error fixing wallet balance:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixWalletBalance()
