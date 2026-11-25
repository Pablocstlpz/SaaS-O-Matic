// Lo que pasa ANTES de levantar nada. El arranque fallido se prueba en un proceso aparte
// porque server.ts termina el proceso con process.exit(1).
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { validarConfig } from "../src/config.js";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));

const arrancar = (variables: Record<string, string>) =>
  spawnSync(process.execPath, ["--import", "tsx", "src/server.ts"], {
    cwd: RAIZ,
    env: { ...process.env, ...variables },
    encoding: "utf8",
    // Si arrancara de verdad no terminaría nunca.
    timeout: 10_000,
  });

describe("configuración", () => {
  it.each(["abc", "3000abc", "0", "65536"])(
    "no arranca con PORT=%s",
    (puerto) => {
      const { status, stderr } = arrancar({ PORT: puerto });
      expect(status).toBe(1);
      // Sin esto valdría cualquier otro fallo de arranque.
      expect(stderr).toContain("[ERROR][config] PORT tiene que ser un número entero");
    },
    15_000,
  );

  it("acepta una configuración válida", () => {
    expect(validarConfig()).toEqual([]);
  });
});
