const generatePaymentId = () => {
    // Generates a string like 'PAY58291' — each digit is 1-9, no zeros
    let digits = '';
    for (let i = 0; i < 5; i++) {
        digits += Math.floor(Math.random() * 9) + 1; // 1 to 9
    }
    return 'PAY' + digits;
};

module.exports = {
    generatePaymentId
};
