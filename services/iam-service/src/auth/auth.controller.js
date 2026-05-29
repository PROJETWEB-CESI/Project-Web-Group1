const AuthService = require('../auth/auth.service');

async function register(req, res) {
    try {
        const { email, password } = req.body;
        const result = await AuthService.register(email, password);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;
        const result = await AuthService.login(email, password);
        res.status(200).json(result);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
}

function validate(req, res){
    if(!req.user){
        return res.status(401).json({ message: 'Unauthorized' });
    }
    return res.status(200).json({ message: 'Token is valid' });
}

module.exports = {
    register,
    login,
    validate
};