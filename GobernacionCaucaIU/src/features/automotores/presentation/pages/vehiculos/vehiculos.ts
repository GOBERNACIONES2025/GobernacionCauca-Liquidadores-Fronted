import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center min-h-[300px] space-y-3">
      <div class="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
        <i class="fa-solid fa-car text-blue-400 text-2xl"></i>
      </div>
      <h2 class="text-xl font-bold text-white">Módulo Vehicular</h2>
      <p class="text-slate-400 text-sm">Expediente y gestión de vehículos</p>
    </div>
  `
})
export class Vehiculos {}
