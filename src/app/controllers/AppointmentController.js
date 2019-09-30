import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt-BR';
import User from '../models/User';
import File from '../models/File';
import Appointment from '../models/Appointment';
import Notification from '../schemas/Notification';
import Queue from '../../lib/Queue';
import CancellationMail from '../jobs/CancellationMail';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      // -> Campo past e cancelable sao virtuais, criados dentro do model.
      // E retornam true ou false
      attributes: ['id', 'date', 'past', 'cancelable'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });
    return res.json(appointments);
  }

  async store(req, res) {
    // -> Validação..
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });
    // -> Valida os dados do body
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Campos Inválidos.' });
    }
    // -> Deu certo a validacao, agora pega os seguintes campos..
    const { provider_id, date } = req.body;

    // -> É de suma importancia que seja validado o provider e o provider_id, ambos devem coincidir
    const isProvider = await User.findOne({
      where: {
        id: provider_id,
        provider: true,
      },
    });
    // -> Se retornar false
    if (!isProvider) {
      return res.status(401).json({
        error: 'Você só pode criar agendamentos com provedores de serviços.',
      });
    }
    // -> Checar se quem esta fazendo o agendamento seja diferente do id prestador, ou seja um prestador nao pode fazer um agendamento para ele mesmo
    if (provider_id === req.userId) {
      return res.status(401).json({
        error: 'Não é possível marcar um agendamento para você mesmo.',
      });
    }
    //
    // -> Chegagem de Horarios
    //
    // parseIso tranforma a string repassada em um objeto em um date do javascript
    // o startofhour pega o inicio da hora, se tiver 19:30 ele vai pegar 19:00..
    const hourStart = startOfHour(parseISO(date));
    // -> hourStart esta antes da data atual?
    if (isBefore(hourStart, new Date())) {
      return res
        .status(400)
        .json({ error: 'Datas anteriores não são permitidas' });
    }
    //
    // -> Agendamento no mesmo horario?
    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });
    // -> se ele encontrou o agendamento significa que o horarios NÃO está vago..
    if (checkAvailability) {
      return res
        .status(400)
        .json({ error: 'A data do agendamento não está disponível.' });
    }
    //
    // -> Se passou por todas as validacoes agora sim é criado o agendamento
    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date,
    });
    //
    // -> Beleza, agendamento feito que tal uma notificação para o prestador de servico
    const user = await User.findByPk(req.userId);
    const formatedDate = format(hourStart, "'dia' dd 'de' MMMM', às' H:mm'h'", {
      locale: pt,
    });
    await Notification.create({
      content: `Novo agendamento feito por ${user.name}, para o ${formatedDate}`,
      user: provider_id,
    });
    return res.json(appointment);
  }

  async delete(req, res) {
    // -> Busca o agendamento usando o id passado pelo parametro E inclui no retorno da listagem o provedor de servico tambem
    // pois sera usado para enviar o email
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });
    // return res.json(appointment);
    // -> caso quem esta tentando cancelar o agendamento nao for o dono do agendamento..
    if (appointment.user_id !== req.userId) {
      return res.status(401).json({
        error: 'Você naão tem permissão para cancelar este agendamento.',
      });
    }
    // -> Se ja foi cancelado emita o aviso
    if (appointment.canceled_at !== null) {
      return res.status(401).json({
        error: 'Este agendamento já foi cancelado.',
      });
    }
    // -> Só será possível cancelar o agendamento estando com 2 horas de antecedencia
    // remove 2 horas do agendamento feito
    const dataWithSub = subHours(appointment.date, 2);
    // -> Exemplo
    //  now: 11:00 -> If abaixo pega o horario atual, aqui eu exemplifico como sendo 1 hora antes do agendamento
    //  appointment.date: 12:00 -> Horario agendado no DB
    //  dataWithSub: 10:00 -> Novo horario feito pela constante criada acima
    // Neste exemplo nao sera possivel cancelar por que no horario atual ja passam do horario limite 2 de horaas antescedentes para cancelar
    if (isBefore(dataWithSub, new Date())) {
      return res.status(401).json({
        error:
          'Você só pode cancelar o agendamento, estando à 2 horas de antecedencia.',
      });
    }
    // -> se estiver tudo certo
    appointment.canceled_at = new Date();
    await appointment.save();
    //
    // -> Beleza, agendamento feito que tal uma notificação para o prestador de servico
    const user = await User.findByPk(req.userId);
    // return res.json(user);
    const formatedDate = format(
      appointment.date,
      "'dia' dd 'de' MMMM', para às' H'h'",
      {
        locale: pt,
      }
    );
    await Notification.create({
      content: `${user.name}, cancelou o agendamento do ${formatedDate}`,
      user: appointment.provider_id,
    });
    //
    // Envia um email tambem avisando o cancelamento
    await Queue.add(CancellationMail.key, {
      appointment,
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
