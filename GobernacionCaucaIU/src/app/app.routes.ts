import { Routes } from '@angular/router';
import { AutomotoresIndex } from './features/automotores/presentation/pages/automotores-index/automotores-index';

export const routes: Routes = [
    { path: '', redirectTo: 'automotores-index', pathMatch: 'full' },
    { path: 'automotores-index', component: AutomotoresIndex }
];
