import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// La raiz solo pinta la ruta activa. Cabeceras, menus y pies van en el layout de cada zona,
// asi la zona publica y el panel no tienen que preguntar "en que URL estoy" para decidir que mostrar.
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {}
