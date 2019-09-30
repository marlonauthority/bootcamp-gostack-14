import jwt from 'jsonwebtoken';
import authConfig from '../../config/auth';
import User from '../models/User';
import File from '../models/File';

class SessionController {
  async store(req, res) {
    const { email, password } = req.body;
    // -> Procuramos pelo usuario e incluimos o avatar
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });
    // -> Caso não exista um usuario
    if (!user) {
      return res.status(401).json({ erro: 'Usuário inexistente.' });
    }
    // -> Verificamos a senha a funcao check esta criada no model.
    // Se caso a senha não corresponde
    if (!(await user.checkPassword(password))) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }
    // -> Se tudo deu certo ate aqui, pegamos os dados e repassamos para json..
    const { id, name, avatar, provider } = user;
    return res.json({
      user: {
        id,
        name,
        email,
        provider,
        avatar,
      },
      // -> Repassamos mais um parâmetro que fará a assinatura do token
      // -> Dentro de sign passaremos como primeiro parametro o payload, que são as informacoes criptografadas
      // neste caso o id, e como segundo parametro a chave para criptografar
      // o terceiro parmetro é a validade
      token: jwt.sign({ id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }),
    });
  }
}

export default new SessionController();
