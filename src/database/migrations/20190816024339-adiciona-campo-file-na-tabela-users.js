module.exports = {
  up: (queryInterface, Sequelize) => {
    // Adiciona uma coluna
    return queryInterface.addColumn(
      // 1º Qual o nome da tabela
      // 2º Nome da Coluna
      'users',
      'avatar_id',
      {
        // Qual seu tipo, aqui vamos referenciar o id do campo nao seu conteudo
        type: Sequelize.INTEGER,
        // Chave estrangeira => Model: Nome da tabela & => Key: Chave a ser referenciada, no caso o id da tabela files
        references: { model: 'files', key: 'id' },
        // Caso tenha um update sera um efeito cascade ou seja aqui tb se altera automaticamente
        onUpdate: 'CASCADE',
        // Se o user for deletado, aqui sera null
        onDelete: 'SET NULL',
        allowNull: true,
      }
    );
  },

  down: queryInterface => {
    // remove a coluna da tabela users da coluna avatar_id
    return queryInterface.removeColumn('users', 'avatar_id');
  },
};
