export const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Se genera un código de 6 dígitos
}