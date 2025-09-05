// src/app/components/admin/admin-stats/admin-stats.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../../services/api.service';

interface Statistiques {
  overview: {
    total_users: number;
    total_rdv: number;
    total_revenus: number;
    croissance_mensuelle: number;
  };
  evolution: Array<{
    label: string;
    rdv: number;
    revenus: number;
    nouveaux_utilisateurs: number;
  }>;
  top_specialites: Array<{
    nom: string;
    specialite: string;
    nombre_consultations: number;
    revenus: number;
  }>;
  top_medecins: Array<{
    nom: string;
    specialite: string;
    nombre_consultations: number;
    revenus: number;
  }>;
  repartition_paiements: {
    en_ligne: number;
    au_cabinet: number;
    en_attente: number;
    echoues: number;
  };
  activite_recente: Array<{
    type: string;
    description: string;
    date: string;
    montant?: number;
  }>;
}

interface RapportData {
  type: string;
  periode: {
    debut: string;
    fin: string;
  };
  data: any;
}

@Component({
  selector: 'app-admin-stats',
  templateUrl: './admin-stats.component.html',
  styleUrls: ['./admin-stats.component.scss']
})
export class AdminStatsComponent implements OnInit {
  statistiques: Statistiques | null = null;
  isLoading = true;
  isGeneratingRapport = false;
  
  rapportForm!: FormGroup;
  dernierRapport: RapportData | null = null;

  periodeOptions = [
    { value: 'semaine', label: 'Cette semaine' },
    { value: 'mois', label: 'Ce mois' },
    { value: 'trimestre', label: 'Ce trimestre' },
    { value: 'annee', label: 'Cette année' }
  ];

  typeRapportOptions = [
    { value: 'utilisateurs', label: 'Rapport Utilisateurs' },
    { value: 'rendez_vous', label: 'Rapport Rendez-vous' },
    { value: 'paiements', label: 'Rapport Paiements' },
    { value: 'medecins', label: 'Rapport Médecins' },
    { value: 'specialites', label: 'Rapport Spécialités' },
    { value: 'complet', label: 'Rapport Complet' }
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadStatistiques();
  }

  private initializeForm(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.rapportForm = this.fb.group({
      type: ['complet', Validators.required],
      date_debut: [firstDayOfMonth.toISOString().split('T')[0], Validators.required],
      date_fin: [today.toISOString().split('T')[0], Validators.required]
    });
  }

  loadStatistiques(periode: string = 'mois'): void {
    this.isLoading = true;
    
    this.apiService.getStatistiquesGenerales({ periode }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.statistiques = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
        this.snackBar.open('Erreur lors du chargement des statistiques', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  onPeriodeChange(periode: string): void {
    this.loadStatistiques(periode);
  }

  refreshData(): void {
    this.loadStatistiques();
  }

  genererRapport(): void {
    if (!this.rapportForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    this.isGeneratingRapport = true;
    
    const formData = this.rapportForm.value;

    this.apiService.genererRapport(formData).subscribe({
      next: (response) => {
        this.isGeneratingRapport = false;
        if (response.success && response.data) {
          this.dernierRapport = {
            type: formData.type,
            periode: {
              debut: formData.date_debut,
              fin: formData.date_fin
            },
            data: response.data
          };
          
          this.snackBar.open('Rapport généré avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        }
      },
      error: (error) => {
        this.isGeneratingRapport = false;
        const errorMessage = error.error?.message || 'Erreur lors de la génération du rapport';
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  exporterRapport(format: 'json' | 'csv'): void {
    if (!this.dernierRapport) return;

    const filename = `rapport_${this.dernierRapport.type}_${new Date().toISOString().split('T')[0]}.${format}`;
    
    if (format === 'json') {
      const dataStr = JSON.stringify(this.dernierRapport.data, null, 2);
      this.downloadFile(dataStr, filename, 'application/json');
    } else if (format === 'csv') {
      const csvData = this.convertToCSV(this.dernierRapport.data);
      this.downloadFile(csvData, filename, 'text/csv');
    }
  }

  private convertToCSV(data: any): string {
    if (!data || typeof data !== 'object') {
      return '';
    }

    // Convertir l'objet en format CSV basique
    let csv = '';
    
    if (Array.isArray(data)) {
      if (data.length > 0) {
        // Headers
        const headers = Object.keys(data[0]);
        csv += headers.join(',') + '\n';
        
        // Rows
        data.forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'string' ? `"${value}"` : value;
          });
          csv += values.join(',') + '\n';
        });
      }
    } else {
      // Pour les objets, créer une structure clé-valeur
      csv = 'Propriété,Valeur\n';
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (typeof value !== 'object') {
          csv += `"${key}","${value}"\n`;
        }
      });
    }
    
    return csv;
  }

  private downloadFile(data: string, filename: string, type: string): void {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.rapportForm.controls).forEach(key => {
      const control = this.rapportForm.get(key);
      control?.markAsTouched();
    });
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(montant);
  }

  formatPourcentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }

  getCroissanceColor(value: number): string {
    return value >= 0 ? '#4caf50' : '#f44336';
  }

  getSpecialiteColor(index: number): string {
    const colors = ['#3f51b5', '#ff4081', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4'];
    return colors[index % colors.length];
  }

  getActivityColor(type: string): string {
    switch (type) {
      case 'nouveau_utilisateur':
        return '#4caf50';
      case 'nouveau_rdv':
        return '#2196f3';
      case 'paiement':
        return '#ff9800';
      case 'annulation':
        return '#f44336';
      default:
        return '#666';
    }
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'nouveau_utilisateur':
        return 'person_add';
      case 'nouveau_rdv':
        return 'event';
      case 'paiement':
        return 'payment';
      case 'annulation':
        return 'cancel';
      default:
        return 'info';
    }
  }

  getRapportTypeLabel(type: string): string {
    const option = this.typeRapportOptions.find(o => o.value === type);
    return option?.label || type;
  }
}