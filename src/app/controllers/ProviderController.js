import User from '../models/User';
import File from '../models/File';

import Cache from '../../lib/Cache';

class ProviderController {
  async index(req, res) {
    // primeiro busca no chace
    const cached = await Cache.get('providers');
    // se existir cache
    if (cached) {
      return res.json(cached);
    }
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
    // grava a lista no cache
    await Cache.set('providers', providers);

    return res.json(providers);
  }
}

export default new ProviderController();
