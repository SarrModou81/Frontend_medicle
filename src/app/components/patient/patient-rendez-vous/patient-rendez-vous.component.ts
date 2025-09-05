// src/app/components/patient/patient-rendez-vous/patient-rendez-vous.component.ts
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService, RendezVous } from '../../../services/api.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-patient-rendez-vous',
  templateUrl: './patient-rendez-vous.component.html',
  styleUrls: ['./patient-rendez-vous.component.scss']
})
export class PatientRendezVousComponent implements OnInit {
  rendezVous: RendezVous[] = [];
  isLoading = true;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  
  // Filtres
  selectedStatut = '';
  dateDebut = '';
  dateFin = '';

  displayedColumns: string[] = ['date', 'medecin', 'specialite', 'statut', 'paiement', 'actions'];

  statutOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'en_attente', label: 'En attente' },
    { value: 'confirme', label: 'Confirmé' },
    { value: 'termine', label: 'Terminé' },
    { value: 'annule', label: 'Annulé' }
  ];

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadRendezVous();
  }

  loadRendezVous(): void {
    this.isLoading = true;
    
    const params: any = {
      page: this.currentPage
    };

    if (this.selectedStatut) {
      params.statut = this.selectedStatut;
    }
    if (this.dateDebut) {
      params.date_debut = this.dateDebut;
    }
    if (this.dateFin) {
      params.date_fin = this.dateFin;
    }

    this.apiService.getPatientRendezVous(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.rendezVous = response.data.data;
          this.currentPage = response.data.current_page;
          this.totalPages = response.data.last_page;
          this.totalItems = response.data.total;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des rendez-vous:', error);
        this.snackBar.open('Erreur lors du chargement des rendez-vous', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadRendezVous();
  }

  clearFilters(): void {
    this.selectedStatut = '';
    this.dateDebut = '';
    this.dateFin = '';
    this.currentPage = 1;
    this.loadRendezVous();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadRendezVous();
  }

  peutAnnuler(rdv: RendezVous): boolean {
    if (rdv.statut !== 'en_attente' && rdv.statut !== 'confirme') {
      return false;
    }
    
    const dateRdv = new Date(rdv.date_heure);
    const maintenant = new Date();
    const diffHeures = (dateRdv.getTime() - maintenant.getTime()) / (1000 * 60 * 60);
    
    return diffHeures > 24; // 24h à l'avance
  }

  annulerRendezVous(rdv: RendezVous): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Annuler le rendez-vous',
        message: `Êtes-vous sûr de vouloir annuler votre rendez-vous avec Dr. ${rdv.medecin.user.nom} ${rdv.medecin.user.prenom} ?`,
        confirmText: 'Annuler le RDV',
        cancelText: 'Conserver'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.apiService.annulerRendezVous(rdv.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Rendez-vous annulé avec succès', 'Fermer', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.loadRendezVous();
            }
          },
          error: (error) => {
            const errorMessage = error.error?.message || 'Erreur lors de l\'annulation';
            this.snackBar.open(errorMessage, 'Fermer', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  telechargerJustificatif(rdv: RendezVous): void {
    if (rdv.justificatif) {
      window.open(this.apiService.telechargerJustificatif(rdv.justificatif.id), '_blank');
    } else {
      this.genererJustificatif(rdv);
    }
  }

  genererJustificatif(rdv: RendezVous): void {
    this.apiService.genererJustificatif(rdv.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Justificatif généré avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          // Télécharger automatiquement
          window.open(response.data.download_url, '_blank');
          
          // Recharger la liste pour mettre à jour le statut
          this.loadRendezVous();
        }
      },
      error: (error) => {
        const errorMessage = error.error?.message || 'Erreur lors de la génération du justificatif';
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
        return 'default';
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

  getPaiementStatutLabel(statut: string): string {
    switch (statut) {
      case 'en_attente':
        return 'En attente';
      case 'paye':
        return 'Payé';
      case 'rembourse':
        return 'Remboursé';
      default:
        return statut;
    }
  }

  getPaiementStatutColor(statut: string): string {
    switch (statut) {
      case 'paye':
        return 'success';
      case 'rembourse':
        return 'accent';
      default:
        return 'warn';
    }
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPrix(prix: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(prix);
  }
}