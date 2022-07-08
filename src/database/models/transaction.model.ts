import { Document, Model, Types } from "mongoose";
import { ILogger } from "../../lib/logger/logger";
import { IAccountSchema } from "../schemas/account.schema";
import { ITransactionSchema, TransactionDto } from "../schemas/transaction.schema";
import { BaseModel } from "./base.model";
import { IPaginationOptions, IPaginationResult } from "./interfaces";

export class TransactionModel extends BaseModel {
    model: Model<ITransactionSchema>;
    logger: ILogger;
    accountModel: Model<IAccountSchema>;
    constructor(model: Model<ITransactionSchema>, accountModel: Model<IAccountSchema>, logger: ILogger) {
        super(model, logger);
        this.accountModel = accountModel;
    }
    async findAll(): Promise<ITransactionSchema[]> {
        return this.model.find({}).exec();
    }
    async findAllByAccountId(accountId: Types.ObjectId, userId: Types.ObjectId, paginationOptions: IPaginationOptions): Promise<IPaginationResult<TransactionDto>> {
        const query = {account: new Types.ObjectId(accountId), user: new Types.ObjectId(userId)};
        const findQuery = this.model.aggregate<ITransactionSchema>()
            .match(query);
        if (paginationOptions.sort) {
            paginationOptions.sort.forEach(sort => 
                findQuery.sort(sort)
            );
        }
        const countQuery = this.model.find(query).count(query);
        if (paginationOptions.offset !== undefined && paginationOptions.limit !== undefined) {
            findQuery.skip(paginationOptions.offset).limit(paginationOptions.limit);
        }
        const items = await findQuery.exec()
            .then(items => items.map(item => new TransactionDto(item)));
        const count = await countQuery.exec();
        return {
            count,
            items,
        };
    }
    async findOne(id: Types.ObjectId, userId: Types.ObjectId): Promise<TransactionDto | undefined> {
        const find = await this.model.aggregate<ITransactionSchema>()
            .match({_id: new Types.ObjectId(id), user: new Types.ObjectId(userId)})
            .exec();
        if (find.length > 0) {
            return new TransactionDto(find[0]);
        } else {
            return undefined;
        }
    }
    async create(options: Partial<ITransactionSchema>): Promise<Document<unknown, any, IAccountSchema>> {
        const account = await this.accountModel.findOne({_id: options.account}).exec();
        if (account !== null) {
            const transaction = new this.model();
            Object.assign(transaction, options);
            try {
                await transaction.save();
                await this.accountModel.updateOne({_id: account._id}, {$push: {transactions: transaction._id}}).orFail().exec();
                return transaction;
            } catch (err) {
                this.logger.error({error: err, transaction}, `Failed create new transaction`);
                throw new Error('FAILED_CREATE_TRANSACTION');
            }
        } else {
            this.logger.error(`No account found with _id ${options._id}, can't create new transaction`);
            throw new Error('NO_ACCOUNT_FOUND');
        }
    }
    async delete(id: Types.ObjectId): Promise<boolean> {
        const transaction = await this.model.findOne({
            _id: new Types.ObjectId(id),
        }).exec();

        if (transaction !== null) {
            try {
                const accountId: Types.ObjectId = transaction.account instanceof Types.ObjectId ? transaction.account : transaction.account._id;
                await this.accountModel.updateOne({_id: accountId}, {$pull: {transactions: new Types.ObjectId(id)}}).exec();
                await transaction.delete();
                return true;
            } catch (err) {
                this.logger.error({error: err}, `Failed delete transaction with _id: ${id}`);
                return false;
            }
        } else { 
            this.logger.error(`No transaction found with _id ${id}`);
            return false;
        }
    }
    async save(transaction: Partial<ITransactionSchema>): Promise<boolean> {
        return this.model.findOneAndUpdate({_id: new Types.ObjectId(transaction._id)}, transaction)
            .exec()
            .then(() => true)
            .catch(() => false);
    }
}