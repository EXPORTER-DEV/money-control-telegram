import moment from "moment";

export const formatTimestamp = (timestamp: number): string => {
    return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
};
