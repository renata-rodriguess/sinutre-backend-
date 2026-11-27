import 'express-async-errors';
import { app } from './app';
const PORT = Number(process.env.PORT) || 3333;

app.listen(PORT, () => {
  console.log(`SiNutre back rodando em http://localhost:${PORT}`);
});
