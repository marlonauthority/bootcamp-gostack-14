import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import authConfig from '../../config/auth';

export default async (req, res, next) => {
  // -> Buscar o Token no Header
  const authHeader = req.headers.authorization;
  // -> Caso não tiver
  if (!authHeader) {
    return res.status(401).json({ erro: 'Token inexistente.' });
  }
  // -> Se existir, sera retornado um array de 2 posicoes e vamos fazer um recorte da palavra e token
  // o objetivo é ficar apenas o token
  // [
  //  'Bearer',
  //  'token',
  // ]
  const [, token] = authHeader.split(' ');

  // -> Fazer uma descriptografia afim de verificar se os tokens coincidem
  try {
    // -> O uso do promisify serve para usarmos async await
    // -> promisify(jwt.verify) retorna uma funcao dai o uso de () no final
    // -> Necessario passar o token e secret
    const decoded = await promisify(jwt.verify)(token, authConfig.secret);
    // -> Caso der certo, retornara um id do user que foi inserido la no sessionController
    // -> Vamos colocar esse id dentro do "req" para usar-mos de forma "livre"
    req.userId = decoded.id;
    // -> continua o fluxo
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token Inválido!' });
  }
};
