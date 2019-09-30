import User from '../models/User';
import Notification from '../schemas/Notification';

class NotificationController {
  async index(req, res) {
    // -> Verificar se o usuario logado é um prestador
    const checkIsProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });
    if (!checkIsProvider) {
      return res.status(401).json({
        error:
          'Somente prestadores de serviçoes podem vizualizar as notificações!',
      });
    }
    // -> Listar as notificacoes
    const notifications = await Notification.find({
      user: req.userId,
    })
      .sort('-createdAt')
      .limit(20);
    return res.json(notifications);
  }

  async update(req, res) {
    // -> existem duas formas a primeira abaixo "comentada"
    // const notification = await Notification.findById(req.params.id);
    // nesta 2ª forma passamos um id no comeco do array e como segundo o campo a ser modificado
    // new true, retorna a informacao atualizada
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    return res.json(notification);
  }
}

export default new NotificationController();
