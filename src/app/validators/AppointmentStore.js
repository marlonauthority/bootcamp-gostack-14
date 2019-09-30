import * as Yup from 'yup';

export default async (req, res, next) => {
  try {
    // -> Validação..
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });
    await schema.validate(req.body, { abortEarly: false });
    return next();
  } catch (err) {
    return res
      .status(400)
      .json({ error: 'Campos Inválidos.', messages: err.inner });
  }
};
