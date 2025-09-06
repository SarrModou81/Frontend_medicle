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
  // =============== PROPRIÉTÉS ===============
  rendezVous: RendezVous[] = [];
  isLoading = true;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  
  // Filtres
  selectedStatut = '';
  dateDebut: Date | null = null;
  dateFin: Date | null = null;

  // Configuration du tableau
  displayedColumns: string[] = ['date', 'medecin', 'specialite', 'statut', 'paiement', 'actions'];

  // Options de statut pour les filtres
  statutOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'en_attente', label: 'En attente' },
    { value: 'confirme', label: 'Confirmé' },
    { value: 'termine', label: 'Terminé' },
    { value: 'annule', label: 'Annulé' }
  ];

  // =============== CONSTRUCTEUR ===============
  constructor(
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  // =============== LIFECYCLE ===============
  ngOnInit(): void {
    this.loadRendezVous();
  }

  // =============== GESTION DES DONNÉES ===============
  
  /**
   * Charge la liste des rendez-vous avec filtres et pagination
   */
  loadRendezVous(): void {
    this.isLoading = true;
    
    const params: any = {
      page: this.currentPage
    };

    // Ajout des filtres s'ils sont définis
    if (this.selectedStatut) {
      params.statut = this.selectedStatut;
    }
    if (this.dateDebut) {
      params.date_debut = this.dateDebut.toISOString().split('T')[0];
    }
    if (this.dateFin) {
      params.date_fin = this.dateFin.toISOString().split('T')[0];
    }

    this.apiService.getPatientRendezVous(params).subscribe({
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
        this.showErrorMessage('Erreur lors du chargement des rendez-vous');
        this.isLoading = false;
      }
    });
  }

  // =============== GESTION DES FILTRES ===============
  
  /**
   * Déclenché quand un filtre change
   */
  onFilterChange(): void {
    this.currentPage = 1;
    this.loadRendezVous();
  }

  /**
   * Efface tous les filtres
   */
  clearFilters(): void {
    this.selectedStatut = '';
    this.dateDebut = null;
    this.dateFin = null;
    this.currentPage = 1;
    this.loadRendezVous();
  }

  // =============== GESTION DE LA PAGINATION ===============
  
  /**
   * Gère le changement de page
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadRendezVous();
  }

  // =============== LOGIQUE MÉTIER ===============
  
  /**
   * Vérifie si un rendez-vous peut être annulé
   */
  peutAnnuler(rdv: RendezVous): boolean {
    // Seuls les RDV en attente ou confirmés peuvent être annulés
    if (rdv.statut !== 'en_attente' && rdv.statut !== 'confirme') {
      return false;
    }
    
    // Vérification du délai (24h à l'avance)
    const dateRdv = new Date(rdv.date_heure);
    const maintenant = new Date();
    const diffHeures = (dateRdv.getTime() - maintenant.getTime()) / (1000 * 60 * 60);
    
    return diffHeures > 24;
  }

  /**
   * Vérifie si un paiement en ligne est requis
   * LOGIQUE CORRIGÉE: Exclut les rendez-vous annulés
   */
  isPaiementRequis(rdv: RendezVous): boolean {
    return rdv.type_paiement === 'en_ligne' && 
           rdv.statut_paiement === 'en_attente' &&
           rdv.statut !== 'annule'; // Pas de paiement pour les RDV annulés
  }

  // =============== ACTIONS SUR LES RENDEZ-VOUS ===============
  
  /**
   * Annule un rendez-vous après confirmation
   */
  annulerRendezVous(rdv: RendezVous): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Annuler le rendez-vous',
        message: `Êtes-vous sûr de vouloir annuler votre rendez-vous avec Dr. ${rdv.medecin?.user?.nom} ${rdv.medecin?.user?.prenom} ?`,
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
              this.showSuccessMessage('Rendez-vous annulé avec succès');
              this.loadRendezVous();
            }
          },
          error: (error) => {
            const errorMessage = error.error?.message || 'Erreur lors de l\'annulation';
            this.showErrorMessage(errorMessage);
          }
        });
      }
    });
  }

  /**
   * Télécharge ou génère un justificatif
   */
  telechargerJustificatif(rdv: RendezVous): void {
    if (rdv.justificatif) {
      // Télécharger le justificatif existant
      const url = this.apiService.telechargerJustificatif(rdv.justificatif.id);
      window.open(url, '_blank');
    } else {
      // Générer un nouveau justificatif
      this.genererJustificatif(rdv);
    }
  }

  /**
   * Génère un nouveau justificatif
   */
  genererJustificatif(rdv: RendezVous): void {
    // Vérification des conditions pour générer un justificatif
    if (rdv.statut !== 'termine' && rdv.statut !== 'confirme') {
      this.showWarningMessage('Le justificatif ne peut être généré que pour les consultations confirmées ou terminées');
      return;
    }

    this.apiService.genererJustificatif(rdv.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.showSuccessMessage('Justificatif généré avec succès');
          
          // Télécharger automatiquement si l'URL est disponible
          if (response.data.download_url) {
            window.open(response.data.download_url, '_blank');
          }
          
          // Recharger la liste pour mettre à jour le statut
          this.loadRendezVous();
        }
      },
      error: (error) => {
        const errorMessage = error.error?.message || 'Erreur lors de la génération du justificatif';
        this.showErrorMessage(errorMessage);
      }
    });
  }

  /**
   * Redirige vers la page de paiement
   * LOGIQUE CORRIGÉE: Vérifie que le RDV n'est pas annulé
   */
  procederAuPaiement(rdv: RendezVous): void {
    // Vérification que le RDV n'est pas annulé
    if (rdv.statut === 'annule') {
      this.showWarningMessage('Impossible de payer pour un rendez-vous annulé');
      return;
    }

    if (this.isPaiementRequis(rdv)) {
      // Rediriger vers la page de paiement
      window.location.href = `/dashboard/patient/paiement/${rdv.id}`;
    } else {
      this.showWarningMessage('Aucun paiement requis pour ce rendez-vous');
    }
  }

  // =============== FORMATAGE ET AFFICHAGE ===============
  
  /**
   * Retourne la couleur du statut du rendez-vous
   */
  getStatutColor(statut: string): string {
    switch (statut) {
      case 'confirme':
        return 'primary';
      case 'termine':
        return 'success';
      case 'annule':
        return 'warn';
      case 'en_attente':
      default:
        return '';
    }
  }

  /**
   * Retourne le label du statut du rendez-vous
   */
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

  /**
   * Retourne le label du statut de paiement selon le type
   * MÉTHODE CORRIGÉE: Prend en compte le type de paiement
   */
  getPaiementStatutLabel(statut: string, typePaiement: string): string {
    if (typePaiement === 'au_cabinet') {
      switch (statut) {
        case 'en_attente':
          return 'À payer au cabinet';
        case 'paye':
          return 'Payé au cabinet';
        case 'rembourse':
          return 'Remboursé';
        default:
          return statut;
      }
    } else {
      // Paiement en ligne
      switch (statut) {
        case 'en_attente':
          return 'En attente';
        case 'paye':
          return 'Payé en ligne';
        case 'rembourse':
          return 'Remboursé';
        default:
          return statut;
      }
    }
  }

  /**
   * Retourne la couleur du statut de paiement
   */
  getPaiementStatutColor(statut: string): string {
    switch (statut) {
      case 'paye':
        return 'success';
      case 'rembourse':
        return 'accent';
      case 'en_attente':
      default:
        return 'warn';
    }
  }

  /**
   * Retourne l'icône selon le type de paiement
   */
  getPaiementIcon(typePaiement: string): string {
    return typePaiement === 'au_cabinet' ? 'payment' : 'credit_card';
  }

  /**
   * Retourne le tooltip d'information sur le paiement
   * LOGIQUE CORRIGÉE: Gère les rendez-vous annulés
   */
  getPaiementTooltip(rdv: RendezVous): string {
    // Si le rendez-vous est annulé
    if (rdv.statut === 'annule') {
      return 'Rendez-vous annulé - Aucun paiement requis';
    }

    if (rdv.type_paiement === 'au_cabinet') {
      if (rdv.statut_paiement === 'paye') {
        return 'Consultation payée directement au cabinet du médecin';
      } else {
        return 'Le paiement se fera directement au cabinet lors de la consultation';
      }
    } else {
      // Paiement en ligne
      if (rdv.statut_paiement === 'paye') {
        return 'Consultation payée en ligne par carte bancaire';
      } else {
        return 'Paiement en ligne requis avant la consultation';
      }
    }
  }

  /**
   * Formate une date pour l'affichage
   */
  formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateStr; // Retourne la chaîne originale en cas d'erreur
    }
  }

  /**
   * Formate un prix en francs CFA
   */
  formatPrix(prix: number): string {
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0
      }).format(prix);
    } catch (error) {
      return `${prix} FCFA`; // Format de fallback
    }
  }

  // =============== UTILITAIRES D'AFFICHAGE ===============
  
  /**
   * Affiche un message de succès
   */
  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Affiche un message d'erreur
   */
  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Affiche un message d'avertissement
   */
  private showWarningMessage(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 4000,
      panelClass: ['warning-snackbar']
    });
  }
}