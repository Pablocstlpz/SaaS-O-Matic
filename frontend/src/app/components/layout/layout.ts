import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

// Cabecera comun y <router-outlet> para las pantallas.
@Component({
  selector: 'app-layout',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {}
