export const CurrencyDelimiter = (currency) => {
    return String(currency).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export const CurrencyFormat = (currency) => {
    return String(currency).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' VNĐ';
}