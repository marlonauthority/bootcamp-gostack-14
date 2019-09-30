import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt-BR';
import Mail from '../../lib/Mail';

class CancellationMail {
  get key() {
    return 'CancellationMail';
  }

  async handle({ data }) {
    const { appointment } = data;
    // console.log('a fila executou com sucesso :D');
    await Mail.sendMail({
      to: `${appointment.provider.name} <${appointment.provider.email}>`,
      subject: 'Agendamento foi cancelado',
      // text: `${user.name}, cancelou o agendamento do ${formatedDate}`,
      template: 'cancelation',
      context: {
        provider: appointment.provider.name,
        user: appointment.user.name,
        date: format(
          parseISO(appointment.date),
          "'dia' dd 'de' MMMM', para às' H'h'",
          {
            locale: pt,
          }
        ),
      },
    });
  }
}
export default new CancellationMail();
