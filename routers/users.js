var express = require("express");
var router_auth = express.Router();
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var { Users } = require("../models/Users.js");

router_auth.post("/register", async (req, res) => {
    try {
        var { Nome, Email, Senha } = req.body;

        if (!Nome || !Email || !Senha) {
            return res.status(400).json({
                success: false,
                message: "Todos os campos são obrigatórios"
            });
        }

        if (Nome.length < 3) {
            return res.status(400).json({
                success: false,
                message: "O nome deve ter pelo menos 3 caracteres"
            });
        }

        if (Senha.length < 6) {
            return res.status(400).json({
                success: false,
                message: "A senha deve ter pelo menos 6 caracteres"
            });
        }

        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(Email)) {
            return res.status(400).json({
                success: false,
                message: "Email inválido"
            });
        }

        var userExists = await Users.findOne({ where: { Email: Email } });

        if (userExists) {
            return res.status(409).json({
                success: false,
                message: "Este email já está cadastrado"
            });
        }

        var salt = await bcrypt.genSalt(10);
        var hashedPassword = await bcrypt.hash(Senha, salt);

        var newUser = await Users.create({
            Nome: Nome.trim(),
            Email: Email.toLowerCase().trim(),
            Senha: hashedPassword,
            eAdmin: false,
            tipo: 'pedagogico'
        });

        var token = jwt.sign(
            { 
                id: newUser.id, 
                email: newUser.Email, 
                nome: newUser.Nome, 
                eAdmin: false,
                tipo: 'pedagogico'
            },
            process.env.SECRET || "default_secret_key",
            { expiresIn: '24h' }
        );

        return res.status(201).json({
            success: true,
            message: "Usuário criado com sucesso",
            token: token,
            user: {
                id: newUser.id,
                nome: newUser.Nome,
                email: newUser.Email,
                eAdmin: false,
                tipo: 'pedagogico'
            }
        });

    } catch (error) {
        console.error("Erro no registro:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_auth.post("/login", async (req, res) => {
    try {
        var { Email, Senha } = req.body;

        if (!Email || !Senha) {
            return res.status(400).json({
                success: false,
                message: "Todos os campos são obrigatórios"
            });
        }

        var user = await Users.findOne({
            where: { Email: Email.toLowerCase().trim() }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Email ou senha incorretos"
            });
        }

        var isValidPassword = await bcrypt.compare(Senha, user.Senha);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: "Email ou senha incorretos"
            });
        }

        var token = jwt.sign(
            { 
                id: user.id, 
                email: user.Email, 
                nome: user.Nome, 
                eAdmin: user.eAdmin || false,
                tipo: user.tipo || 'pedagogico'
            },
            process.env.SECRET || "default_secret_key",
            { expiresIn: '24h' }
        );

        return res.status(200).json({
            success: true,
            message: "Login realizado com sucesso",
            token: token,
            user: {
                id: user.id,
                nome: user.Nome,
                email: user.Email,
                eAdmin: user.eAdmin || false,
                tipo: user.tipo || 'pedagogico'
            }
        });

    } catch (error) {
        console.error("Erro no login:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_auth.post("/recuperar_senha", async (req, res) => {
    try {
        var { Email } = req.body;

        if (!Email) {
            return res.status(400).json({
                success: false,
                message: "O email é obrigatório"
            });
        }

        var user = await Users.findOne({
            where: { Email: Email.toLowerCase().trim() }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Email não encontrado"
            });
        }

        var resetToken = jwt.sign(
            { id: user.id, email: user.Email },
            process.env.SECRET || "default_secret_key",
            { expiresIn: '1h' } // Mudado para 1 hora por segurança
        );

        return res.status(200).json({
            success: true,
            message: "Link de recuperação enviado com sucesso",
            resetToken: resetToken
        });

    } catch (error) {
        console.error("Erro na recuperação de senha:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_auth.post("/resetar_senha", async (req, res) => {
    try {
        var { Token, NovaSenha } = req.body;

        if (!Token || !NovaSenha) {
            return res.status(400).json({
                success: false,
                message: "Token e nova senha são obrigatórios"
            });
        }

        if (NovaSenha.length < 6) {
            return res.status(400).json({
                success: false,
                message: "A senha deve ter pelo menos 6 caracteres"
            });
        }

        var decoded = jwt.verify(Token, process.env.SECRET || "default_secret_key");

        var user = await Users.findByPk(decoded.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuário não encontrado"
            });
        }

        var salt = await bcrypt.genSalt(10);
        var hashedPassword = await bcrypt.hash(NovaSenha, salt);

        await user.update({
            Senha: hashedPassword
        });

        return res.status(200).json({
            success: true,
            message: "Senha alterada com sucesso"
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: "Token inválido ou expirado"
            });
        }

        console.error("Erro ao resetar senha:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_auth.get("/validar_token", async (req, res) => {
    try {
        var token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token não fornecido"
            });
        }

        var decoded = jwt.verify(token, process.env.SECRET || "default_secret_key");

        var user = await Users.findByPk(decoded.id, {
            attributes: { exclude: ['Senha'] }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuário não encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            user: user
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: "Token inválido"
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: "Token expirado"
            });
        }

        console.error("Erro ao validar token:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_auth.post("/logout", async (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Logout realizado com sucesso"
    });
});

router_auth.get("/users", async (req, res) => {
    try {
        var users = await Users.findAll({
            attributes: { exclude: ['Senha'] },
            order: [['id', 'ASC']]
        });
        return res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error("Erro ao listar users:", error);
        return res.status(500).json({ success: false, message: "Erro interno do servidor" });
    }
});

router_auth.put("/users/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var { tipo, eAdmin } = req.body;
        var user = await Users.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "Utilizador não encontrado" });
        }
        var updates = {};
        if (tipo !== undefined) updates.tipo = tipo;
        if (eAdmin !== undefined) updates.eAdmin = eAdmin;
        await user.update(updates);
        return res.status(200).json({
            success: true,
            message: "Utilizador atualizado com sucesso",
            user: { id: user.id, nome: user.Nome, email: user.Email, eAdmin: user.eAdmin, tipo: user.tipo }
        });
    } catch (error) {
        console.error("Erro ao atualizar user:", error);
        return res.status(500).json({ success: false, message: "Erro interno do servidor" });
    }
});

router_auth.put("/users/:id/senha", async (req, res) => {
    try {
        var { id } = req.params;
        var { NovaSenha } = req.body;
        if (!NovaSenha || NovaSenha.length < 6) {
            return res.status(400).json({ success: false, message: "A senha deve ter pelo menos 6 caracteres" });
        }
        var user = await Users.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "Utilizador não encontrado" });
        }
        var salt = await bcrypt.genSalt(10);
        var hashedPassword = await bcrypt.hash(NovaSenha, salt);
        await user.update({ Senha: hashedPassword });
        return res.status(200).json({ success: true, message: "Senha alterada com sucesso" });
    } catch (error) {
        console.error("Erro ao alterar senha:", error);
        return res.status(500).json({ success: false, message: "Erro interno do servidor" });
    }
});

module.exports = router_auth;