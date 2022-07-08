export const formatAmount = (amount: number): string => {
    amount = +amount;
    let isNegative: boolean = false;

    if (amount < 0) {
        amount = Math.abs(amount);
        isNegative = true;
    }

    return `${isNegative ? '- ' : ''}${amount.toFixed(2)}`;
};