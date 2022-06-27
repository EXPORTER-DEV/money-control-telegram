import { Mongoose } from 'mongoose';
import { IUserSchema, UserSchema } from './schemas/user.schema';
import { UserModel } from './models/user.model';
import { AccountSchema, IAccountSchema } from './schemas/account.schema';
import { AccountModel } from './models/account.model';
import { ITransactionSchema, TransactionSchema } from './schemas/transaction.schema';
import { TransactionModel } from './models/transaction.model';
import { ILogger } from '../lib/logger/logger';

export const load = (connection: Mongoose, logger: ILogger) => {
    const User = connection.model<IUserSchema>('User', UserSchema);
    const Account = connection.model<IAccountSchema>('Account', AccountSchema);
    const Transaction = connection.model<ITransactionSchema>('Transaction', TransactionSchema);
    return {
        UserModel: new UserModel(User, logger),
        Account: new AccountModel(Account, User, logger),
        Transaction: new TransactionModel(Transaction, logger),
    };
};