import Sequelize, { Model } from 'sequelize';
import { isBefore, subHours } from 'date-fns';

class Appointment extends Model {
  static init(sequelize) {
    super.init(
      {
        date: Sequelize.DATE,
        canceled_at: Sequelize.DATE,
        // Campo virtual para mostrar quais já passaram da data
        past: {
          type: Sequelize.VIRTUAL,
          get() {
            return isBefore(this.date, new Date());
          },
        },
        // Campo virtual que retorna se o agendamento é cancelavel ou nao..
        cancelable: {
          type: Sequelize.VIRTUAL,
          get() {
            // retorne se a data atual é anterior a data marcada -2 horas
            return isBefore(new Date(), subHours(this.date, 2));
          },
        },
      },
      {
        sequelize,
      }
    );
    return this;
  }

  // -> Relacionamento
  static associate(models) {
    // Esta tabela pertence a
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    // OBS: é obrigatório usar apelido quando existem mais de um relacionamento, caso contrario o sequelize se perde
    this.belongsTo(models.User, { foreignKey: 'provider_id', as: 'provider' });
  }
}
export default Appointment;
