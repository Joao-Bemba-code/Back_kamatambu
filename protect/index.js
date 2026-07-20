var jwt = require("jsonwebtoken");

var JWT_SECRET = process.env.SECRET || "default_secret_key";

module.exports = {
    authenticate: async (req, res, next) => {
        var authHeader = req.headers["authorization"];

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Token não fornecido"
            });
        }

        var token = authHeader.replace("Bearer ", "");

        try {
            var decoded = jwt.verify(token, JWT_SECRET);

            if (!decoded || !decoded.id) {
                return res.status(401).json({ success: false, message: "Token inválido" });
            }

            if (decoded.tipo === 'pendente') {
                return res.status(403).json({
                    success: false,
                    message: "Conta pendente de aprovação. Aguarde um administrador."
                });
            }

            req.user = {
                id: decoded.id,
                email: decoded.email,
                nome: decoded.nome,
                eAdmin: decoded.eAdmin || false,
                tipo: decoded.tipo || 'pendente'
            };

            return next();

        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: "Token expirado" });
            }
            return res.status(401).json({ success: false, message: "Token inválido" });
        }
    },

    requireAdmin: async (req, res, next) => {
        if (!req.user || !req.user.eAdmin) {
            return res.status(403).json({
                success: false,
                message: "Acesso restrito a administradores"
            });
        }
        return next();
    }
};
