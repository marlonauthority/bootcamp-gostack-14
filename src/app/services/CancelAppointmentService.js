import { isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';

import User from '../models/User';
import Appointment from '../models/Appointment';

import Notification from '../schemas/Notification';

import Queue from '../../lib/Queue';
import Cache from '../../lib/Cache';

import CancellationMail from '../jobs/CancellationMail';

class CancelAppointmentService {
  async run({ provider_id, user_id }) {
    // -> Busca o agendamento usando o id passado pelo parametro E inclui no retorno da listagem o provedor de servico tambem
    // pois sera usado para enviar o email
    const appointment = await Appointment.findByPk(provider_id, {
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
    if (appointment.user_id !== user_id) {
      throw new Error('Você não tem permissão para cancelar este agendamento.');
    }
    // -> Se ja foi cancelado emita o aviso
    if (appointment.canceled_at !== null) {
      throw new Error('Este agendamento já foi cancelado.');
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
      throw new Error(
        'Você só pode cancelar o agendamento, estando à 2 horas de antecedencia.'
      );
    }
    // -> se estiver tudo certo
    appointment.canceled_at = new Date();
    await appointment.save();
    //
    // -> Beleza, agendamento feito que tal uma notificação para o prestador de servico
    const user = await User.findByPk(user_id);
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

    // -> invalidate cache

    await Cache.invalidatePrefix(`user:${user_id}:appointments`);

    return appointment;
  }
}
export default new CancelAppointmentService();
