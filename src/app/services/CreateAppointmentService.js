import { format, startOfHour, parseISO, isBefore } from 'date-fns';
import pt from 'date-fns/locale/pt';

import User from '../models/User';
import Appointment from '../models/Appointment';

import Notification from '../schemas/Notification';

import Cache from '../../lib/Cache';

class CreateAppointmentService {
  async run({ provider_id, user_id, date }) {
    // -> É de suma importancia que seja validado o provider e o provider_id, ambos devem coincidir
    const isProvider = await User.findOne({
      where: {
        id: provider_id,
        provider: true,
      },
    });
    // -> Se retornar false
    if (!isProvider) {
      throw new Error(
        'Você só pode criar agendamentos com provedores de serviços.'
      );
    }
    // -> Checar se quem esta fazendo o agendamento seja diferente do id prestador, ou seja um prestador nao pode fazer um agendamento para ele mesmo
    if (provider_id === user_id) {
      throw new Error('Não é possível marcar um agendamento para você mesmo.');
    }
    //
    // -> Chegagem de Horarios
    //
    // parseIso tranforma a string repassada em um objeto em um date do javascript
    // o startofhour pega o inicio da hora, se tiver 19:30 ele vai pegar 19:00..
    const hourStart = startOfHour(parseISO(date));
    // -> hourStart esta antes da data atual?
    if (isBefore(hourStart, new Date())) {
      throw new Error('Datas anteriores não são permitidas.');
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
      throw new Error('A data do agendamento não está disponível.');
    }
    //
    // -> Se passou por todas as validacoes agora sim é criado o agendamento
    const appointment = await Appointment.create({
      user_id,
      provider_id,
      date,
    });
    //
    // -> Beleza, agendamento feito que tal uma notificação para o prestador de servico
    const user = await User.findByPk(user_id);
    const formatedDate = format(hourStart, "'dia' dd 'de' MMMM', às' H:mm'h'", {
      locale: pt,
    });
    //
    // -> notifica o provider do agendamento
    await Notification.create({
      content: `Novo agendamento feito por ${user.name}, para o ${formatedDate}`,
      user: provider_id,
    });

    // -> invalidate cache

    await Cache.invalidatePrefix(`user:${user.id}:appointments`);

    return appointment;
  }
}
export default new CreateAppointmentService();
