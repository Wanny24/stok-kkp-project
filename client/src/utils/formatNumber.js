export const formatNumberWithDots = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const clean = value.toString().replace(/\D/g, '');
    if (!clean) return '';
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const cleanNumberString = (value) => {
    if (value === null || value === undefined) return '';
    return value.toString().replace(/\./g, '');
};
