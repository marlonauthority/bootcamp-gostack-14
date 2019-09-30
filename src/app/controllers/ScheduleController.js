import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { Op } from 'sequelize';
import Appointment from '../models/Appointment';
import User from '../models/User';

class ScheduleController {
  async index(req, res) {
    // -> Checar se o usuario é um prestador de servico
    const checkUserProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });
    // -> se nao for um prestador
    if (!checkUserProvider) {
      return res
        .status(401)
        .json({ erro: 'Usuário não é um prestador de serviço.' });
    }
    // -> pega a data da requisicao
    const { date } = req.query;
    const parseDate = parseISO(date);
    //
    // -> pegar os agendamentos do dia
    const appointments = await Appointment.findAll({
      where: {
        provider_id: req.userId,
        canceled_at: null,
        // Comparacao beetween "entre"
        // aqui vamos pegar tudo entre o inicio do horario do dia e o final
        // 00:00:00 ate as 23:59:59
        date: {
          [Op.between]: [startOfDay(parseDate), endOfDay(parseDate)],
        },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
      order: ['date'],
    });
    return res.json(appointments);
  }
}

export default new ScheduleController();
