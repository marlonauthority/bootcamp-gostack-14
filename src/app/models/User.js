import Sequelize, { Model } from 'sequelize';
import bcrypt from 'bcryptjs';

class User extends Model {
  // -> classe que sera automaticamente chamada na inicializacao
  static init(sequelize) {
    super.init(
      {
        // -> os campos abaixo representao quais receberao dados ou alteracoes
        // -> O Campo password é virtual e nao esta presente no model de User
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        password: Sequelize.VIRTUAL,
        password_hash: Sequelize.STRING,
        provider: Sequelize.BOOLEAN,
      },
      {
        sequelize,
      }
    );
    // -> Metodo antes de salvar
    this.addHook('beforeSave', async user => {
      if (user.password) {
        user.password_hash = await bcrypt.hash(user.password, 8);
      }
    });
    return this;
  }

  // Relacionamento com Files
  static associate(models) {
    // Pertence a.. o "as" é apenas para colocar um apelido (opcional)
    this.belongsTo(models.File, { foreignKey: 'avatar_id', as: 'avatar' });
  }

  // Verifica a senha recebida bate com a do banco
  // Essa funcao retornará true caso as senhas coincidem
  checkPassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }
}
export default User;
