import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Antes de que ningún fichero importe config.ts: las pruebas nunca tocan la BD de desarrollo.
    env: {
      DB_ALMACEN: ":memory:",
      PORT: "3000",
      FRONTEND_URL: "http://localhost:4200",
    },
    restoreMocks: true,
  },
});
