// src/app/components/medecin/medecin-rendez-vous/medecin-rendez-vous.component.ts - CORRIGÉ
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService, RendezVous } from '../../../services/api.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-medecin-rendez-vous',
  templateUrl: './medecin-rendez-vous.component.html',
  styleUrls: ['./medecin-rendez-vous.component.scss']
})
export class MedecinRendezVousComponent implements OnInit {
  rendezVous: RendezVous[] = [];
  isLoading = true;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  
  // Filtres
  selectedStatut = '';
  selectedDate: Date | null = null;

  displayedColumns: string[] = ['date', 'patient', 'motif', 'statut', 'paiement', 'actions'];

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
    if (this.selectedDate) {
      params.date = this.selectedDate.toISOString().split('T')[0];
    }

    this.apiService.getMedecinRendezVous(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
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
    this.selectedDate = null;
    this.currentPage = 1;
    this.loadRendezVous();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadRendezVous();
  }

  confirmerRendezVous(rdv: RendezVous): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmer le rendez-vous',
        message: `Voulez-vous confirmer le rendez-vous avec ${rdv.patient?.user?.prenom} ${rdv.patient?.user?.nom} ?`,
        confirmText: 'Confirmer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.apiService.confirmerRendezVous(rdv.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Rendez-vous confirmé avec succès', 'Fermer', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.loadRendezVous();
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
    });
  }

  terminerRendezVous(rdv: RendezVous): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Terminer le rendez-vous',
        message: `Marquer le rendez-vous avec ${rdv.patient?.user?.prenom} ${rdv.patient?.user?.nom} comme terminé ?`,
        confirmText: 'Terminer',
        cancelText: 'Annuler',
        type: 'confirm'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.apiService.terminerRendezVous(rdv.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Rendez-vous marqué comme terminé', 'Fermer', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.loadRendezVous();
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
    });
  }

  annulerRendezVous(rdv: RendezVous): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Annuler le rendez-vous',
        message: `Êtes-vous sûr de vouloir annuler le rendez-vous avec ${rdv.patient?.user?.prenom} ${rdv.patient?.user?.nom} ?`,
        confirmText: 'Annuler le RDV',
        cancelText: 'Conserver',
        type: 'warning'
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

  peutConfirmer(rdv: RendezVous): boolean {
    return rdv.statut === 'en_attente';
  }

  peutTerminer(rdv: RendezVous): boolean {
    if (rdv.statut !== 'confirme') return false;
    
    const dateRdv = new Date(rdv.date_heure);
    const maintenant = new Date();
    
    return dateRdv <= maintenant;
  }

  peutAnnuler(rdv: RendezVous): boolean {
    return rdv.statut === 'en_attente' || rdv.statut === 'confirme';
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