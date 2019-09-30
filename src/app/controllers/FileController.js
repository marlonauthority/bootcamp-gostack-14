import File from '../models/File';

class FileController {
  async store(req, res) {
    // -> Abaixo renomeamos as duas propriedades adivindas da requisicao
    const { originalname: name, filename: path } = req.file;
    // -> Criamos no DB
    const file = await File.create({
      name,
      path,
    });
    return res.json(file);
  }
}

export default new FileController();
