import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { PatientLayoutComponent } from './layouts/patient-layout/patient-layout.component';
import { MedecinLayoutComponent } from './layouts/medecin-layout/medecin-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

import { AuthGuard } from './core/auth/auth.guard';
import { RoleGuard } from './core/auth/role.guard';

const routes: Routes = [
  // Redirection par défaut
  { 
    path: '', 
    redirectTo: '/login', 
    pathMatch: 'full' 
  },
  
  // Pages d'authentification
  { 
    path: 'login', 
    component: LoginComponent 
  },
  { 
    path: 'register', 
    component: RegisterComponent 
  },
  
  // Espace Patient
  {
    path: 'patient',
    component: PatientLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'patient' },
    loadChildren: () => import('./features/patient/patient.module').then(m => m.PatientModule)
  },
  
  // Espace Médecin
  {
    path: 'medecin',
    component: MedecinLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'medecin' },
    loadChildren: () => import('./features/medecin/medecin.module').then(m => m.MedecinModule)
  },
  
  // Espace Admin
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'admin' },
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule)
  },
  
  // Route de fallback
  { 
    path: '**', 
    redirectTo: '/login' 
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: true, // Pour déboguer les routes
    onSameUrlNavigation: 'reload'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }