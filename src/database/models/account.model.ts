import { Document, Model, Types } from "mongoose";
import { BaseModel } from "./base.model";
import { AccountDto, AccountTypeEnum, IAccountSchema } from "../schemas/account.schema";
import { IUserSchema } from "../schemas/user.schema";
import { ILogger } from "../../lib/logger/logger";

export interface IFindAllPaginationResult {
    items: AccountDto[];
    count: number;
}

export class AccountModel extends BaseModel {
    model: Model<IAccountSchema>;
    logger: ILogger;
    userModel: Model<IUserSchema>;
    constructor(model: Model<IAccountSchema>, userModel: Model<IUserSchema>, logger: ILogger) {
        super(model, logger);
        this.userModel = userModel;
    }
    async findAll(): Promise<IAccountSchema[]> {
        return this.model.find({}).exec();
    }
    async findAllByUserId(userId: Types.ObjectId, skip?: number, limit?: number): Promise<IFindAllPaginationResult> {
        const query = {user: userId};
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
        if (skip !== undefined && limit !== undefined) {
            findQuery.skip(skip).limit(limit);
        }
        const items = await findQuery.exec()
            .then(items => items.map(item => new AccountDto(item)));
        const count = await countQuery.exec();
        return {
            count,
            items,
        };
    }
    async create(userId: Types.ObjectId, type: AccountTypeEnum, name: string): Promise<Document<unknown, any, IAccountSchema>> {
        const user = await this.userModel.findOne({_id: userId}).exec();
        if (user !== null) {
            const account = new this.model();
            account.user = userId;
            account.type = type;
            account.name = name;
            try {
                await account.save();
                await this.userModel.updateOne({_id: account.user}, {$push: {accounts: account._id}}).orFail().exec();
                return account;
            } catch (err) {
                this.logger.error({error: err, account}, `Failed create new account.`);
                throw new Error('FAILED_CREATE');
            }
        } else {
            this.logger.error(`Unknown user with _id ${userId}, can't create new account.`);
            throw new Error('UNKNOWN_USER');
        }
    }
    async delete(id: Types.ObjectId): Promise<boolean> {
        const account = await this.model.findOne({_id: id}).exec();
        if (account !== null) {
            try {
                await this.userModel.updateOne({_id: account.user}, {$pull: {accounts: account._id}}).orFail().exec();
                await account.delete();
                return true;
            } catch (err) {
                this.logger.error({error: err}, `Failed delete account with _id: ${id}`);
                return false;
            }
        } else { 
            this.logger.error(`Unknown account with _id ${id}`);
            return false;
        }
    }
    async save(account: IAccountSchema): Promise<boolean> {
        return this.model.findOneAndUpdate({_id: account._id}, account)
            .exec()
            .then(() => true)
            .catch(() => false);
    }
}