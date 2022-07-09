export const calculatePageIndex = (count: number, limit: number): number => 
    Math.floor(count / limit) * limit;