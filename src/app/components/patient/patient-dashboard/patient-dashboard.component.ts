// src/app/components/patient/patient-dashboard/patient-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, RendezVous, StatistiquesPatient, NotificationPatient } from '../../../services/api.service';
import { AuthService, User } from '../../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

interface QuickAction {
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  color: 'primary' | 'accent' | 'warn';
}

@Component({
  selector: 'app-patient-dashboard',
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.scss']
})
export class PatientDashboardComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = true;
  
  statistiques: StatistiquesPatient = {
    total_rdv: 0,
    rdv_confirmes: 0,
    rdv_annules: 0,
    rdv_termines: 0,
    rdv_ce_mois: 0,
    montant_total_depense: 0,
    paiements_en_ligne: 0,
    paiements_au_cabinet: 0,
    specialites_consultees: 0
  };

  prochainRdv: RendezVous | null = null;
  notifications: NotificationPatient[] = [];

  quickActions: QuickAction[] = [
    {
      title: 'Rechercher un médecin',
      subtitle: 'Trouvez le bon professionnel',
      icon: 'search',
      route: '/dashboard/patient/medecins',
      color: 'primary'
    },
    {
      title: 'Mes rendez-vous',
      subtitle: 'Gérez vos consultations',
      icon: 'event',
      route: '/dashboard/patient/rendez-vous',
      color: 'accent'
    },
    {
      title: 'Mon profil',
      subtitle: 'Mettez à jour vos informations',
      icon: 'person',
      route: '/dashboard/patient/profil',
      color: 'warn'
    }
  ];

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    
    // Charger les statistiques
    this.apiService.getPatientStatistiques().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.statistiques = response.data;
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    });

    // Charger le prochain rendez-vous
    this.apiService.getPatientRendezVous({ statut: 'confirme' }).subscribe({
      next: (response) => {
        if (response.success && response.data.data.length > 0) {
          // Trouver le prochain RDV
          const rdvFuturs = response.data.data.filter(rdv => 
            new Date(rdv.date_heure) > new Date()
          ).sort((a, b) => 
            new Date(a.date_heure).getTime() - new Date(b.date_heure).getTime()
          );
          
          if (rdvFuturs.length > 0) {
            this.prochainRdv = rdvFuturs[0];
          }
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des rendez-vous:', error);
      }
    });

    // Charger les notifications
    this.apiService.getPatientNotifications().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.notifications = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des notifications:', error);
        this.isLoading = false;
      }
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'rdv_proche':
        return 'schedule';
      case 'paiement_attente':
        return 'payment';
      default:
        return 'info';
    }
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(montant);
  }

  onActionError(action: string): void {
    this.snackBar.open(`Impossible d'accéder à ${action}`, 'Fermer', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }
}