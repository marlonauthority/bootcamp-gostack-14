import * as Yup from 'yup';
import User from '../models/User';
import File from '../models/File';

class UserController {
  async store(req, res) {
    // -> Validacao
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string()
        .required()
        .min(6),
    });
    // -> Verifica se no corpo da requisicao batem com as validacoes do yup
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Erro nas validacões.' });
    }

    // -> Verificar se existe email no DB
    const userExists = await User.findOne({ where: { email: req.body.email } });
    // caso exista o email, enta no if
    if (userExists) {
      return res.status(400).json({ error: 'Usuário já existe.' });
    }
    // -> Cria um user e apenas os dados repassados
    const { id, name, email, provider } = await User.create(req.body);

    // -> Retorna os dados repassados
    return res.json({
      id,
      name,
      email,
      provider,
    });
  }

  async update(req, res) {
    // -> Validacao
    // no caso do password, caso o user passe o oldpassword o campo password é obrigatorio
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(6),
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });
    // -> Verifica se no corpo da requisicao batem com as validacoes do yup
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Erro nas validacões.' });
    }

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
