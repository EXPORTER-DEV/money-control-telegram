import { IUserSchema } from "../../database/schemas/user.schema";
import { IDatabaseContext } from "../database/database.interface";

export interface IUserContext extends IDatabaseContext {
    user: IUserSchema;
}