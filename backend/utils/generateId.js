const generatePaymentId = () => {
    // Generates a string like 'PAY58291' — each digit is 1-9, no zeros
    let digits = '';
    for (let i = 0; i < 5; i++) {
        digits += Math.floor(Math.random() * 9) + 1; // 1 to 9
    }
    return 'PAY' + digits;
};

const generateEmployeeId = () => {
    // Generates a 9-digit numeric string starting with '61' (e.g., '618391472')
    // Rule: starts with 61, total 9 digits, no zeros
    let digits = '61';
    for (let i = 0; i < 7; i++) {
        digits += Math.floor(Math.random() * 9) + 1; // 1 to 9
    }
    return digits;
};

module.exports = {
    generatePaymentId,
    generateEmployeeId
};
