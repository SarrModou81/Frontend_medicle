import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Guards
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

// Components
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

// Patient Components
import { PatientDashboardComponent } from './components/patient/patient-dashboard/patient-dashboard.component';
import { MedecinListComponent } from './components/patient/medecin-list/medecin-list.component';
import { RendezVousFormComponent } from './components/patient/rendez-vous-form/rendez-vous-form.component';
import { PatientRendezVousComponent } from './components/patient/patient-rendez-vous/patient-rendez-vous.component';
import { PaiementComponent } from './components/patient/paiement/paiement.component';
import { PatientProfilComponent } from './components/patient/patient-profil/patient-profil.component';

// Médecin Components
import { MedecinDashboardComponent } from './components/medecin/medecin-dashboard/medecin-dashboard.component';
import { MedecinRendezVousComponent } from './components/medecin/medecin-rendez-vous/medecin-rendez-vous.component';
import { MedecinProfilComponent } from './components/medecin/medecin-profil/medecin-profil.component';
import { MedecinHorairesComponent } from './components/medecin/medecin-horaires/medecin-horaires.component';

// Admin Components
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';
import { AdminSpecialitesComponent } from './components/admin/admin-specialites/admin-specialites.component';
import { AdminStatsComponent } from './components/admin/admin-stats/admin-stats.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Routes protégées avec authentification
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      // Routes Patient
      {
        path: 'patient',
        canActivate: [RoleGuard],
        data: { expectedRoles: ['patient'] },
        children: [
          { path: '', component: PatientDashboardComponent },
          { path: 'medecins', component: MedecinListComponent },
          { path: 'rendez-vous/nouveau/:medecinId', component: RendezVousFormComponent },
          { path: 'rendez-vous', component: PatientRendezVousComponent },
          { path: 'paiement/:rendezVousId', component: PaiementComponent },
          { path: 'profil', component: PatientProfilComponent }
        ]
      },
      
      // Routes Médecin
      {
        path: 'medecin',
        canActivate: [RoleGuard],
        data: { expectedRoles: ['medecin'] },
        children: [
          { path: '', component: MedecinDashboardComponent },
          { path: 'rendez-vous', component: MedecinRendezVousComponent },
          { path: 'profil', component: MedecinProfilComponent },
          { path: 'horaires', component: MedecinHorairesComponent }
        ]
      },
      
      // Routes Admin
      {
        path: 'admin',
        canActivate: [RoleGuard],
        data: { expectedRoles: ['admin'] },
        children: [
          { path: '', component: AdminDashboardComponent },
          { path: 'utilisateurs', component: AdminUsersComponent },
          { path: 'specialites', component: AdminSpecialitesComponent },
          { path: 'statistiques', component: AdminStatsComponent }
        ]
      }
    ]
  },
  
  // Route wildcard pour les pages non trouvées
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }