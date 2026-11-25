import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-no-encontrado',
  imports: [RouterLink, MatButtonModule, TranslatePipe],
  templateUrl: './no-encontrado.html',
  styleUrl: './no-encontrado.css',
})
export class NoEncontrado {}
