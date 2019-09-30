import multer from 'multer';
import crypto from 'crypto';
import { extname, resolve } from 'path';

export default {
  // -> Nesta 1º chave do objeto diz para o multer como guardar os files
  storage: multer.diskStorage({
    destination: resolve(__dirname, '..', '..', 'tmp', 'uploads'),
    filename: (req, file, cb) => {
      // funcao que gera hash aleatorio de 16bytes
      crypto.randomBytes(16, (err, res) => {
        // Se deu erro callback parametro err
        if (err) return cb(err);
        // Se nao deu erro
        // o null serve pra dizer que o callback nao recebeu nenhum erro..
        // o 2º parametro é o nome da imagem que é gerado uma string hexadecimal + a extesao do file
        return cb(null, res.toString('hex') + extname(file.originalname));
      });
    },
  }),
};
