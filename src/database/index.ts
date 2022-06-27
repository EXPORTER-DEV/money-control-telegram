import { Mongoose } from 'mongoose';
import { IUserSchema, UserSchema } from './schemas/user.schema';
import { UserModel } from './models/user.model';

export const load = (connection: Mongoose) => {
    const User = connection.model<IUserSchema>('User', UserSchema);
    return {
        UserModel: new UserModel(User),
    };
};