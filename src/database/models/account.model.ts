import { Document, Model, Types } from "mongoose";
import { BaseModel } from "./base.model";
import { AccountDto, IAccountSchema } from "../schemas/account.schema";
import { IUserSchema } from "../schemas/user.schema";
import { ILogger } from "../../lib/logger/logger";
import { ITransactionSchema } from "../schemas/transaction.schema";
import { IPaginationOptions, IPaginationResult } from "./interfaces";

export class AccountModel extends BaseModel {
    model: Model<IAccountSchema>;
    logger: ILogger;
    userModel: Model<IUserSchema>;
    transactionModel: Model<ITransactionSchema>;
    constructor(model: Model<IAccountSchema>, userModel: Model<IUserSchema>, transactionModel: Model<ITransactionSchema>, logger: ILogger) {
        super(model, logger);
        this.userModel = userModel;
        this.transactionModel = transactionModel;
    }
    async findAll(): Promise<IAccountSchema[]> {
        return this.model.find({}).exec();
    }
    async findAllByUserId(userId: Types.ObjectId, paginationOptions: IPaginationOptions): Promise<IPaginationResult<AccountDto>> {
        const query = {user: new Types.ObjectId(userId)};
        const findQuery = this.model.aggregate<IAccountSchema>()
            .match(query)
            .lookup({
                from: 'transactions',
                localField: 'transactions',
                foreignField: 'account',
                as: 'transactions',
            })
            .addFields({
                transactionsTotal: {$sum: "$transactions.amount"},
            });
        const countQuery = this.model.find(query).count(query);
        if (paginationOptions.offset !== undefined && paginationOptions.limit !== undefined) {
            findQuery.skip(paginationOptions.offset).limit(paginationOptions.limit);
        }
        if (paginationOptions.sort) {
            paginationOptions.sort.forEach(sort => 
                findQuery.sort(sort)
            );
        }
        const items = await findQuery.exec()
            .then(items => items.map(item => new AccountDto(item)));
        const count = await countQuery.exec();
        return {
            count,
            items,
        };
    }
    async findOne(id: Types.ObjectId, userId: Types.ObjectId): Promise<AccountDto | undefined> {
        const find = await this.model.aggregate<IAccountSchema>()
            .match({_id: new Types.ObjectId(id), user: new Types.ObjectId(userId)})
            .lookup({
                from: 'transactions',
                localField: 'transactions',
                foreignField: 'account',
                as: 'transactions',
            })
            .addFields({
                transactionsTotal: {$sum: "$transactions.amount"},
            }).exec();
        if (find.length > 0) {
            return new AccountDto(find[0]);
        } else {
            return undefined;
        }
    }
    async create(options: Partial<IAccountSchema>): Promise<Document<unknown, any, IAccountSchema>> {
        const user = await this.userModel.findOne({_id: options.user}).exec();
        if (user !== null) {
            const account = new this.model();
            Object.assign(account, options);
            try {
                await account.save();
                await this.userModel.updateOne({_id: account.user}, {$push: {accounts: account._id}}).orFail().exec();
                return account;
            } catch (err) {
                this.logger.error({error: err, account}, `Failed create new account`);
                throw new Error('FAILED_CREATE_ACCOUNT');
            }
        } else {
            this.logger.error(`No user found with _id ${options._id}, can't create new account`);
            throw new Error('NO_USER_FOUND');
        }
    }
    async delete(id: Types.ObjectId): Promise<boolean> {
        const account = await this.model.findOne({
            _id: new Types.ObjectId(id)
        }).exec();

        if (account !== null) {
            try {
                const userId: Types.ObjectId = account.user instanceof Types.ObjectId ? account.user : account.user!._id;
                await this.userModel.updateOne({_id: userId}, {$pull: {accounts: account._id}}).exec();
                await this.transactionModel.deleteMany({account: new Types.ObjectId(id)}).exec();
                await account.delete();
                return true;
            } catch (err) {
                this.logger.error({error: err}, `Failed delete account with _id: ${id}`);
                return false;
            }
        } else { 
            this.logger.error(`No account found with _id ${id}`);
            return false;
        }
    }
    async save(account: Partial<IAccountSchema>): Promise<boolean> {
        return this.model.findOneAndUpdate({_id: new Types.ObjectId(account._id)}, account)
            .exec()
            .then(() => true)
            .catch(() => false);
    }
}