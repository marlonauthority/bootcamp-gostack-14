import User from '../models/User';
import File from '../models/File';

import Cache from '../../lib/Cache';

class UserController {
  async store(req, res) {
    // -> Verificar se existe email no DB
    const userExists = await User.findOne({ where: { email: req.body.email } });
    // caso exista o email, enta no if
    if (userExists) {
      return res.status(400).json({ error: 'Usuário já existe.' });
    }
    // -> Cria um user e apenas os dados repassados
    const { id, name, email, provider } = await User.create(req.body);

    // -> caso for um prestador, deve "zerar" a lista do cache
    if (provider) {
      await Cache.invalidate('providers');
    }

    // -> Retorna os dados repassados
    return res.json({
      id,
      name,
      email,
      provider,
    });
  }

  async update(req, res) {
    // -> pagamos os campos do body
    const { email, oldPassword } = req.body;
    // -> buscamos o user usando o primary key
    const user = await User.findByPk(req.userId);

    // -> Caso houver o email
    if (email !== user.email) {
      // Verificar se existe email no DB
      const userExists = await User.findOne({
        where: { email },
      });
      // caso exista o email, enta no if
      if (userExists) {
        return res.status(400).json({ error: 'Usuário já existe.' });
      }
    }

    // caso foi informado o campo oldpassword, cairá aqui
    // -> Caso a senha Old bate com a atual
    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Senhas não coincidem' });
    }

    // se passou pelas verificacoes, att o user
    await user.update(req.body);
    // como ouve uma atualizacao precisamos refazer a query para que retorne os dados ja atualizados
    const { id, name, avatar } = await User.findByPk(req.userId, {
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    // -> Retorna os dados repassados
    return res.json({
      id,
      name,
      email,
      avatar,
    });
  }
}

export default new UserController();
