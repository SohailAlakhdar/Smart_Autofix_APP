import bcrypt from "bcryptjs";
export const generateHash = ({ plaintext = "", saltRound = 12 } = {}) => {
    return bcrypt.hashSync(plaintext, parseInt(saltRound));
};

export const compareHash = ({ plaintext = "", hashValue = "" }) => {
    return bcrypt.compareSync(plaintext, hashValue);
};
