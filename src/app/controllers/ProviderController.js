import User from '../models/User';
import File from '../models/File';

class ProviderController {
  async index(req, res) {
    // -> Busque por todos Usuarios
    const providers = await User.findAll({
      // -> Onde provider tiver true
      where: { provider: true },
      // -> Retorne somente os campos..
      attributes: ['id', 'name', 'email', 'avatar_id'],
      // -> Inclua um relacionamento com model File e retorne os campos..
      include: [
        { model: File, as: 'avatar', attributes: ['name', 'path', 'url'] },
      ],
    });

    return res.json(providers);
  }
}

export default new ProviderController();
