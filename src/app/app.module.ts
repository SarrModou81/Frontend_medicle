import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Angular Material modules
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Services
import { AuthService } from './services/auth.service';
import { ApiService } from './services/api.service';
import { AuthInterceptor } from './interceptors/auth.interceptor';

// Components
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { HeaderComponent } from './components/shared/header/header.component';
import { SidebarComponent } from './components/shared/sidebar/sidebar.component';

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

// Shared Components
import { ConfirmDialogComponent } from './components/shared/confirm-dialog/confirm-dialog.component';
import { LoadingComponent } from './components/shared/loading/loading.component';
import { ChatIaComponent } from './components/shared/chat-ia/chat-ia.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    HeaderComponent,
    SidebarComponent,
    
    // Patient Components
    PatientDashboardComponent,
    MedecinListComponent,
    RendezVousFormComponent,
    PatientRendezVousComponent,
    PaiementComponent,
    PatientProfilComponent,
    
    // Médecin Components
    MedecinDashboardComponent,
    MedecinRendezVousComponent,
    MedecinProfilComponent,
    MedecinHorairesComponent,
    
    // Admin Components
    AdminDashboardComponent,
    AdminUsersComponent,
    AdminSpecialitesComponent,
    AdminStatsComponent,
    
    // Shared Components
    ConfirmDialogComponent,
    LoadingComponent,
    ChatIaComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    BrowserAnimationsModule,
    
    // Material modules
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    MatListModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatExpansionModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatRadioModule,
    MatCheckboxModule
  ],
  providers: [
    AuthService,
    ApiService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }