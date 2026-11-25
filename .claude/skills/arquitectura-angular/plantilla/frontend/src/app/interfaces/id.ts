// Identificador de un recurso tal como lo manda la API: numero con una BD SQL (backend Node + Sequelize),
// texto con MongoDB (backend .NET, ObjectId). El frontend lo trata como un valor opaco: lo guarda,
// lo pone en las URLs y lo devuelve, pero nunca hace cuentas con el ni lo convierte con Number().
export type Id = number | string;
