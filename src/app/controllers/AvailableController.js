import AvailableService from '../services/AvailableService';

class AvailableController {
  // -> Listagem
  async index(req, res) {
    // Recebera do front end uma data do tipo timestamp atravez dos query params
    // pode checar indo no console do navegador e digitar o comando: new Date().getTime()
    const { date } = req.query;
    // -> Se não houver...
    if (!date) {
      return res.status(404).json({ error: 'Data não encontrado' });
    }
    // -> Garantimos que o valor seja inteiro
    const searchDate = Number(date);

    const available = await AvailableService.run({
      date: searchDate,
      provider_id: req.params.providerId,
    });

    return res.json(available);
  }
}

export default new AvailableController();
