import { Op } from 'sequelize';
import {
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  setSeconds,
  format,
  isAfter,
} from 'date-fns';

import Appointment from '../models/Appointment';

class AvailableService {
  async run({ date, provider_id }) {
    // -> Filtro
    const appointments = await Appointment.findAll({
      // onde: o provider sera igual ao que esta buscando
      // e que nao estejam cancelados somente disponivels
      where: {
        provider_id,
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(date), endOfDay(date)],
        },
      },
    });

    // -> Todos os Horários disponíveis!!
    const schedule = [
      '08:00', // 2020-07-13 08:00:00
      '09:00', // 2020-07-13 09:00:00
      '10:00', // 2020-07-13 10:00:00
      '11:00', // ...
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
    ];

    // -> Aqui retorna as datas que estaram disponiveis ao usuaario
    const available = schedule.map(time => {
      // -> divide do vetor hora e minuto
      const [hour, minute] = time.split(':');
      // setar a hora neste formato 2020-07-13 10:00:00
      // seSecunds ficou zero
      const value = setSeconds(setMinutes(setHours(date, hour), minute), 0);
      // verificar se ja passou ou se ja esta ocupado
      return {
        time,
        value: format(value, "yyyy-MM-dd'T'HH:mm:ssxxx"),
        // -> ja passou isAfter(valorAserComparado, diaDeComparacao)
        // ou seja se o horario atual for 8 da noite 20:00 nao havera mais nenhum horario disponivel para agendar
        available:
          isAfter(value, new Date()) &&
          // verificar se o horario do value nao esta contido la dentro dos appointments
          // se o find encontrou significa que aquele horario nao esta disponivel
          !appointments.find(a => format(a.date, 'HH:mm') === time),
      };
    });
    return available;
  }
}

export default new AvailableService();
