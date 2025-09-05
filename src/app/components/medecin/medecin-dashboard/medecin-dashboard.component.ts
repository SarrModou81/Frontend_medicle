// src/app/components/medecin/medecin-dashboard/medecin-dashboard.component.ts - CORRIGÉ
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService, User } from '../../../services/auth.service';
import { ApiService, RendezVous, StatistiquesMedecin } from '../../../services/api.service';

interface QuickAction {
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  color: 'primary' | 'accent' | 'warn';
}

@Component({
  selector: 'app-medecin-dashboard',
  templateUrl: './medecin-dashboard.component.html',
  styleUrls: ['./medecin-dashboard.component.scss']
})
export class MedecinDashboardComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = true;
  
  statistiques: StatistiquesMedecin = {
    total_rdv: 0,
    rdv_confirmes: 0,
    rdv_en_attente: 0,
    rdv_termines: 0,
    rdv_ce_mois: 0,
    rdv_semaine: 0,
    rdv_aujourd_hui: 0,
    revenus_mois: 0,
    revenus_total: 0,
    taux_confirmation: 0,
    temps_moyen_consultation: 30
  };

  prochainRdv: RendezVous | null = null;
  rdvAujourdhui: RendezVous[] = [];

  actionsRapides: QuickAction[] = [
    {
      title: 'Mes rendez-vous',
      subtitle: 'Gérer mes consultations',
      icon: 'event',
      route: '/dashboard/medecin/rendez-vous',
      color: 'primary'
    },
    {
      title: 'Mes horaires',
      subtitle: 'Configurer mes disponibilités',
      icon: 'schedule',
      route: '/dashboard/medecin/horaires',
      color: 'accent'
    },
    {
      title: 'Mon profil',
      subtitle: 'Mettre à jour mes informations',
      icon: 'person',
      route: '/dashboard/medecin/profil',
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
    this.apiService.getMedecinStatistiques().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.statistiques = response.data;
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    });

    // Charger les rendez-vous du médecin
    this.apiService.getMedecinRendezVous().subscribe({
      next: (response) => {
        if (response.success && response.data?.data) {
          const rdv = response.data.data;
          
          // Prochain rendez-vous
          const rdvFuturs = rdv.filter(r => 
            new Date(r.date_heure) > new Date() && 
            ['en_attente', 'confirme'].includes(r.statut)
          ).sort((a, b) => 
            new Date(a.date_heure).getTime() - new Date(b.date_heure).getTime()
          );
          
          if (rdvFuturs.length > 0) {
            this.prochainRdv = rdvFuturs[0];
          }

          // Rendez-vous d'aujourd'hui
          const aujourd_hui = new Date();
          aujourd_hui.setHours(0, 0, 0, 0);
          const demain = new Date(aujourd_hui);
          demain.setDate(demain.getDate() + 1);

          this.rdvAujourdhui = rdv.filter(r => {
            const dateRdv = new Date(r.date_heure);
            return dateRdv >= aujourd_hui && dateRdv < demain;
          }).sort((a, b) => 
            new Date(a.date_heure).getTime() - new Date(b.date_heure).getTime()
          );
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des rendez-vous:', error);
        this.isLoading = false;
      }
    });
  }

  // Méthode pour vérifier si un rendez-vous peut être terminé
  peutTerminer(rdv: RendezVous): boolean {
    if (rdv.statut !== 'confirme') return false;
    return new Date(rdv.date_heure) <= new Date();
  }

  // Méthode pour vérifier si la date est passée
  isAppointmentPassed(dateHeure: string): boolean {
    return new Date(dateHeure) <= new Date();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  confirmerRendezVous(rdv: RendezVous): void {
    this.apiService.confirmerRendezVous(rdv.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Rendez-vous confirmé avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadDashboardData(); // Recharger les données
        }
      },
      error: (error) => {
        const errorMessage = error.error?.message || 'Erreur lors de la confirmation';
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  terminerRendezVous(rdv: RendezVous): void {
    this.apiService.terminerRendezVous(rdv.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Rendez-vous marqué comme terminé', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadDashboardData(); // Recharger les données
        }
      },
      error: (error) => {
        const errorMessage = error.error?.message || 'Erreur lors de la finalisation';
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  getStatutColor(statut: string): string {
    switch (statut) {
      case 'confirme':
        return 'primary';
      case 'termine':
        return 'success';
      case 'annule':
        return 'warn';
      default:
        return '';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'en_attente':
        return 'En attente';
      case 'confirme':
        return 'Confirmé';
      case 'termine':
        return 'Terminé';
      case 'annule':
        return 'Annulé';
      default:
        return statut;
    }
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(montant);
  }
}